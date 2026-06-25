import { Module } from '@nestjs/common';
import { RedisService } from '../../common/service/redis.service';
import { UserModel } from '../../DB/model/user.model';
import UserRepository from '../../DB/repository/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserModel],
  controllers: [UserController],
  providers: [UserService, UserRepository, RedisService],
})
export class UserModule {}
