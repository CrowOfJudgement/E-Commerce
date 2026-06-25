import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../model/user.model';
import BaseRepository from './base.repository';

@Injectable()
class UserRepository extends BaseRepository<User> {
  constructor(@InjectModel(User.name) protected model: Model<User>) {
    super(model);
  }
}

export default UserRepository;
