import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import type { JwtPayload } from 'jsonwebtoken';
import type { HydratedDocument } from 'mongoose';
import type { User } from '../../DB/model/user.model';
import UserRepository from '../../DB/repository/user.repository';
import { emailEnum } from '../../common/enum/email.enum';
import { ProviderEnum } from '../../common/enum/user.enum';
import { RedisService } from '../../common/service/redis.service';
import tokenService from '../../common/service/token.service';
import { eventEmitter } from '../../common/utils/email/email.events';
import { otpEmailTemplate } from '../../common/utils/email/email.template';
import { generateOtp, sendEmail } from '../../common/utils/email/send.email';
import { Compare, Hash } from '../../common/utils/security/hash.security';
import type {
  ForgetPasswordDto,
  GmailAuthDto,
  ResendOtpDto,
  ResetPasswordDto,
  UpdatePasswordDto,
} from './dto/auth.dto';
import type { CreateUserDto } from './dto/createUser.dto';
import type { SignInDto } from './dto/signIn.dto';

type UserDocument = HydratedDocument<User>;

type GoogleTokenPayload = {
  aud?: string;
  email?: string;
  email_verified?: boolean | string;
  error?: string;
  error_description?: string;
  name?: string;
  picture?: string;
};

type AuthTokenPayload = JwtPayload & {
  id?: string;
  sub?: string;
  jti?: string;
};

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const emailExist = await this.userRepository.findOne({
      filter: { email: createUserDto.email },
    });

    if (emailExist) {
      throw new ConflictException('email already exist');
    }

    const { otp, hashedOtp } = this.generateEmailOtp();
    const user = await this.userRepository.create({
      ...createUserDto,
      password: Hash({ plain_text: createUserDto.password }),
      provider: ProviderEnum.Local,
      isConfirmed: false,
      confirmEmailOtp: hashedOtp,
    });

    await this.cacheAndSendEmailOtp({
      email: createUserDto.email,
      subject: emailEnum.confirmEmail,
      otp,
      hashedOtp,
    });

    return this.createAuthResponse(user, 'Signup successful');
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.userRepository.findOne({
      filter: {
        email: signInDto.email,
        provider: { $ne: ProviderEnum.Google },
      },
    });

    if (!user) {
      throw new UnauthorizedException('invalid email or password');
    }

    const isPasswordMatched = Compare({
      plain_text: signInDto.password,
      cipher_text: user.password,
    });

    if (!isPasswordMatched) {
      throw new UnauthorizedException('invalid email or password');
    }

    return this.createAuthResponse(user, 'Signin successful');
  }

  async reSendOtp(resendOtpDto: ResendOtpDto) {
    const user = await this.userRepository.findOne({
      filter: {
        email: resendOtpDto.email,
        isConfirmed: { $ne: true },
        provider: { $ne: ProviderEnum.Google },
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User does not exist or is already confirmed',
      );
    }

    const hashedOtp = await this.sendEmailOtp({
      email: resendOtpDto.email,
      subject: emailEnum.confirmEmail,
    });

    user.confirmEmailOtp = hashedOtp;
    await user.save();

    return { message: 'OTP resent successfully' };
  }

  async signUpWithGmail(gmailAuthDto: GmailAuthDto) {
    const payload = await this.verifyGoogleAccount(gmailAuthDto.idToken);
    const email = payload.email as string;

    let user = await this.userRepository.findOne({ filter: { email } });

    if (!user) {
      user = await this.userRepository.create({
        userName: this.buildGoogleUserName(payload.name, email),
        email,
        password: Hash({ plain_text: randomBytes(32).toString('hex') }),
        profilePic: payload.picture,
        isConfirmed: this.isGoogleEmailVerified(payload.email_verified),
        provider: ProviderEnum.Google,
      });
    }

    if ((user.provider ?? ProviderEnum.Local) === ProviderEnum.Local) {
      throw new ConflictException(
        'This email is already registered with local authentication',
      );
    }

    return this.createAuthResponse(user, 'Google signup successful');
  }

  async loginWithGmail(gmailAuthDto: GmailAuthDto) {
    const payload = await this.verifyGoogleAccount(gmailAuthDto.idToken);
    const email = payload.email as string;

    const user = await this.userRepository.findOne({
      filter: { email, provider: ProviderEnum.Google },
    });

    if (!user) {
      throw new NotFoundException('No Google account found for this email');
    }

    return this.createAuthResponse(user, 'Google login successful');
  }

  async forgetPassword(forgetPasswordDto: ForgetPasswordDto) {
    const user = await this.userRepository.findOne({
      filter: {
        email: forgetPasswordDto.email,
        provider: { $ne: ProviderEnum.Google },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.sendEmailOtp({
      email: forgetPasswordDto.email,
      subject: emailEnum.forgetPassword,
    });

    return { message: 'Password reset OTP sent successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, password } = resetPasswordDto;
    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: { $ne: ProviderEnum.Google },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otpKey = this.redisService.otp_key({
      email,
      subject: emailEnum.forgetPassword,
    });
    const storedOtp = await this.redisService.getValue(otpKey);

    if (!storedOtp || !this.isOtpMatched(otp, storedOtp)) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    user.password = Hash({ plain_text: password });
    await user.save();
    await this.redisService.deleteKey(otpKey);

    return { message: 'Password reset successfully' };
  }

  async updatePassword(
    updatePasswordDto: UpdatePasswordDto,
    authorization?: string,
  ) {
    const { oldPassword, password } = updatePasswordDto;
    const decoded = await this.verifyAccessToken(authorization);
    const userId = decoded.sub ?? decoded.id;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.userRepository.findOne({
      filter: {
        _id: userId,
        provider: { $ne: ProviderEnum.Google },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const match = Compare({
      plain_text: oldPassword,
      cipher_text: user.password,
    });

    if (!match) {
      throw new BadRequestException('Old password is incorrect');
    }

    user.password = Hash({ plain_text: password });
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async logout(authorization?: string) {
    const decoded = await this.verifyAccessToken(authorization, false);
    const tokenExp = decoded.exp;
    const tokenJti = decoded.jti;

    if (!tokenExp || !tokenJti) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const now = Math.floor(Date.now() / 1000);
    const remainingTime = tokenExp - now;

    await this.redisService.setValue({
      key: this.revokedTokenKey(tokenJti),
      value: 'true',
      ttl: remainingTime > 0 ? remainingTime : 1,
    });

    return { message: 'Logged out successfully' };
  }

  findAll() {
    return this.userRepository.find();
  }

  private generateEmailOtp() {
    const otp = generateOtp();
    const hashedOtp = Hash({ plain_text: otp.toString() });

    return { otp, hashedOtp };
  }

  private async sendEmailOtp({
    email,
    subject,
  }: {
    email: string;
    subject: emailEnum;
  }) {
    const { otp, hashedOtp } = this.generateEmailOtp();

    await this.cacheAndSendEmailOtp({ email, subject, otp, hashedOtp });

    return hashedOtp;
  }

  private async cacheAndSendEmailOtp({
    email,
    subject,
    otp,
    hashedOtp,
  }: {
    email: string;
    subject: emailEnum;
    otp: number;
    hashedOtp: string;
  }) {
    await this.redisService.setValue({
      key: this.redisService.otp_key({ email, subject }),
      value: hashedOtp,
      ttl: 60 * 10,
    });

    const emailContent = this.getOtpEmailContent(subject);

    eventEmitter.emit(subject, async () => {
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: otpEmailTemplate({
          title: emailContent.title,
          subtitle: emailContent.subtitle,
          otp,
        }),
      });
    });
  }

  private getOtpEmailContent(subject: emailEnum) {
    if (subject === emailEnum.forgetPassword) {
      return {
        subject: 'Reset your password',
        title: 'Reset your password',
        subtitle: 'Use this code to choose a new password.',
      };
    }

    return {
      subject: 'Confirm your email',
      title: 'Confirm your email',
      subtitle: 'Use this code to verify your account.',
    };
  }

  private async verifyGoogleAccount(idToken: string) {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        idToken,
      )}`,
    );
    const payload = (await response.json()) as GoogleTokenPayload;

    if (!response.ok || payload.error) {
      throw new UnauthorizedException(
        payload.error_description || 'Invalid Google account token',
      );
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (googleClientId && payload.aud !== googleClientId) {
      throw new UnauthorizedException('Invalid Google token audience');
    }

    if (!payload.email) {
      throw new BadRequestException('Google account email is required');
    }

    return payload;
  }

  private isGoogleEmailVerified(emailVerified?: boolean | string) {
    return emailVerified === true || emailVerified === 'true';
  }

  private buildGoogleUserName(name: string | undefined, email: string) {
    const userName = (name || email.split('@')[0] || 'Google User').trim();

    return userName.length >= 5 ? userName : `${userName}_user`;
  }

  private createAuthResponse(user: UserDocument, message: string) {
    const userId = user._id.toString();
    const jti = randomUUID();
    const accessToken = tokenService.GenerateToken({
      payload: {
        id: userId,
        sub: userId,
        email: user.email,
        role: user.role,
        jti,
      },
      secret_key: this.getJwtSecret(),
      options: {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      },
    });

    return {
      message,
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  private sanitizeUser(user: UserDocument) {
    const userObject = user.toObject() as unknown as Record<string, unknown>;

    delete userObject.password;
    delete userObject.confirmEmailOtp;

    return userObject;
  }

  private async verifyAccessToken(
    authorization?: string,
    checkRevoked = true,
  ): Promise<AuthTokenPayload> {
    const token = this.extractBearerToken(authorization);
    let decoded: AuthTokenPayload;

    try {
      decoded = tokenService.VerifyToken({
        token,
        secret_key: this.getJwtSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (checkRevoked && decoded.jti) {
      const isRevoked = await this.redisService.getValue(
        this.revokedTokenKey(decoded.jti),
      );

      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return decoded;
  }

  private extractBearerToken(authorization?: string) {
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization bearer token is required');
    }

    return token;
  }

  private revokedTokenKey(jti: string) {
    return `revoked_token:${jti}`;
  }

  private isOtpMatched(otp: string, storedOtp: string) {
    try {
      return (
        storedOtp === otp ||
        Compare({
          plain_text: otp,
          cipher_text: storedOtp,
        })
      );
    } catch {
      return false;
    }
  }

  private getJwtSecret() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    return process.env.JWT_SECRET;
  }
}
