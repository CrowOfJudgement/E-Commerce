import { Module } from '@nestjs/common';
import { ProductModel } from '../../DB/model/product.model';
import ProductRepository from '../../DB/repository/product.repository';
import ProductService from './product.service';
import ProductController from './product.controller';

@Module({
  imports: [ProductModel],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductRepository, ProductService],
})
export class ProductModule {}
