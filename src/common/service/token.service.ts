import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

type TokenSignOptions = Omit<SignOptions, 'expiresIn'> & {
  expiresIn?: string | number;
};

class TokenService {
  GenerateToken = ({
    payload,
    secret_key,
    options,
  }: {
    payload: object;
    secret_key: Secret;
    options?: TokenSignOptions;
  }): string => {
    return jwt.sign(payload, secret_key, options as SignOptions);
  };

  VerifyToken = ({
    token,
    secret_key,
  }: {
    token: string;
    secret_key: Secret;
  }): JwtPayload => {
    return jwt.verify(token, secret_key) as JwtPayload;
  };
}

export default new TokenService();
