import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand } from '../model/brand.model';
import BaseRepository from './base.repository';

@Injectable()
class BrandRepository extends BaseRepository<Brand> {
  constructor(@InjectModel(Brand.name) protected model: Model<Brand>) {
    super(model);
  }
}

export default BrandRepository;
