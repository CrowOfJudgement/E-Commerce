import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../model/category.model';
import BaseRepository from './base.repository';

@Injectable()
class CategoryRepository extends BaseRepository<Category> {
  constructor(@InjectModel(Category.name) protected model: Model<Category>) {
    super(model);
  }
}

export default CategoryRepository;
