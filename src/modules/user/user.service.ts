import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import UserRepository from '../../DB/repository/user.repository';
import { emailEnum } from '../../common/enum/email.enum';
import { RedisService } from '../../common/service/redis.service';
import tokenService from '../../common/service/token.service';
import { eventEmitter } from '../../common/utils/email/email.events';
import { otpEmailTemplate } from '../../common/utils/email/email.template';
import { generateOtp, sendEmail } from '../../common/utils/email/send.email';
import { Compare, Hash } from '../../common/utils/security/hash.security';
import type { CreateUserDto } from './dto/createUser.dto';
import type { SignInDto } from './dto/signIn.dto';

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

    const otp = generateOtp();
    const hashedOtp = Hash({ plain_text: otp.toString() });
    const user = await this.userRepository.create({
      ...createUserDto,
      password: Hash({ plain_text: createUserDto.password }),
      confirmEmailOtp: hashedOtp,
    });

    await this.redisService.setValue({
      key: this.redisService.otp_key({
        email: createUserDto.email,
        subject: emailEnum.confirmEmail,
      }),
      value: hashedOtp,
      ttl: 60 * 10,
    });

    eventEmitter.emit(emailEnum.confirmEmail, async () => {
      await sendEmail({
        to: createUserDto.email,
        subject: 'Confirm your email',
        html: otpEmailTemplate({
          title: 'Confirm your email',
          subtitle: 'Use this code to verify your account.',
          otp,
        }),
      });
    });

    const accessToken = tokenService.GenerateToken({
      payload: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      secret_key: process.env.JWT_SECRET!,
      options: {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      },
    });

    return { user, accessToken };
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.userRepository.findOne({
      filter: { email: signInDto.email },
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

    return user;
  }

  findAll() {
    return this.userRepository.find();
  }
}
