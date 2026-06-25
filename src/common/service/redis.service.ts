import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { createClient, RedisArgument, RedisClientType } from 'redis';
import { emailEnum } from '../enum/email.enum';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: RedisClientType;
  private isConnected = false;
  private hasLoggedConnectionError = false;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = Number(this.configService.get<string>('REDIS_PORT'));
    const redisUsername = this.configService.get<string>('REDIS_USERNAME');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.client = redisUrl
      ? createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: false,
          },
        })
      : createClient({
          username: redisUsername,
          password: redisPassword,
          socket: {
            host: redisHost,
            port: Number.isNaN(redisPort) ? undefined : redisPort,
            reconnectStrategy: false,
          },
        });

    this.handleEvent();
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (!this.isConnected) {
      return;
    }

    await this.client.quit();
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = Number(this.configService.get<string>('REDIS_PORT'));

    if (!redisUrl && (!redisHost || Number.isNaN(redisPort))) {
      return;
    }

    try {
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to Redis successfully!');
    } catch (error) {
      this.isConnected = false;
      this.logConnectionError(error);
    }
  }

  handleEvent() {
    this.client.on('error', (error) => {
      this.logConnectionError(error);
    });
  }

  private logConnectionError(error: unknown) {
    if (this.hasLoggedConnectionError) {
      return;
    }

    this.hasLoggedConnectionError = true;
    console.log('Connected to Redis Failed!', error);
  }

  revoked_key = ({ userId, jti }: { userId: Types.ObjectId; jti: string }) => {
    return `revoke_token::${userId.toString()}::${jti}`;
  };

  get_key = (userId: Types.ObjectId) => {
    return `revoke_token::${userId.toString()}`;
  };

  otp_key = ({
    email,
    subject = emailEnum.confirmEmail,
  }: {
    email: string;
    subject?: emailEnum;
  }) => {
    return `otp::${email}::${subject}`;
  };

  fcm_key = (userId: Types.ObjectId | string) => {
    return `user:FCM:${userId.toString()}`;
  };

  socketKey = (userId: Types.ObjectId | string) => {
    return `user:Socket:${userId.toString()}`;
  };

  setValue = async ({
    key,
    value,
    ttl,
  }: {
    key: RedisArgument;
    value: string;
    ttl?: number;
  }) => {
    try {
      if (!this.isConnected) {
        return null;
      }

      if (ttl) {
        return await this.client.set(key, value, { EX: ttl });
      }

      return await this.client.set(key, value);
    } catch (error) {
      console.error('fail to set operation', error);
      return null;
    }
  };

  update = async ({
    key,
    value,
    ttl,
  }: {
    key: RedisArgument;
    value: string;
    ttl: number;
  }) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const isExists = await this.client.exists(key);

      if (!isExists) {
        return 0;
      }

      return await this.client.set(key, value, { EX: ttl });
    } catch (error) {
      console.error('fail to update operation', error);
      return null;
    }
  };

  getValue = async (key: RedisArgument) => {
    try {
      if (!this.isConnected) {
        return null;
      }

      return await this.client.get(key);
    } catch (error) {
      console.error('fail to get value', error);
      return null;
    }
  };

  isExist = async (key: RedisArgument) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.exists(key);
    } catch (error) {
      console.error('fail to check existence', error);
      return 0;
    }
  };

  deleteKey = async (key: RedisArgument) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.del(key);
    } catch (error) {
      console.error('fail to delete key', error);
      return 0;
    }
  };

  addFCM = async (userId: Types.ObjectId | string, fcmToken: string) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.sAdd(this.fcm_key(userId), fcmToken);
    } catch (error) {
      console.error('fail to add fcm token', error);
      return 0;
    }
  };

  removeFCM = async (userId: Types.ObjectId | string, fcmToken: string) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.sRem(this.fcm_key(userId), fcmToken);
    } catch (error) {
      console.error('fail to remove fcm token', error);
      return 0;
    }
  };

  getFCMS = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) {
        return [];
      }

      return await this.client.sMembers(this.fcm_key(userId));
    } catch (error) {
      console.error('fail to get fcm tokens', error);
      return [];
    }
  };

  hasFCMS = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.sCard(this.fcm_key(userId));
    } catch (error) {
      console.error('fail to count fcm tokens', error);
      return 0;
    }
  };

  removeFCMUser = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.del(this.fcm_key(userId));
    } catch (error) {
      console.error('fail to remove user fcm tokens', error);
      return 0;
    }
  };

  addSocket = async ({
    userId,
    socketId,
  }: {
    userId: Types.ObjectId | string;
    socketId: string;
  }) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.sAdd(this.socketKey(userId), socketId);
    } catch (error) {
      console.error('fail to add socket id', error);
      return 0;
    }
  };

  removeSocket = async ({
    userId,
    socketId,
  }: {
    userId: Types.ObjectId | string;
    socketId: string;
  }) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.sRem(this.socketKey(userId), socketId);
    } catch (error) {
      console.error('fail to remove socket id', error);
      return 0;
    }
  };

  getSockets = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) {
        return [];
      }

      return await this.client.sMembers(this.socketKey(userId));
    } catch (error) {
      console.error('fail to get socket ids', error);
      return [];
    }
  };

  hasSockets = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.sCard(this.socketKey(userId));
    } catch (error) {
      console.error('fail to count socket ids', error);
      return 0;
    }
  };

  removeSocketUser = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.client.del(this.socketKey(userId));
    } catch (error) {
      console.error('fail to remove user socket ids', error);
      return 0;
    }
  };
}
