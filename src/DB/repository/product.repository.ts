import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../model/product.model';
import BaseRepository from './base.repository';

@Injectable()
class ProductRepository extends BaseRepository<Product> {
  constructor(@InjectModel(Product.name) protected model: Model<Product>) {
    super(model);
  }
}

export default ProductRepository;
