import { Module } from '@nestjs/common';
import { CategoryModel } from '../../DB/model/category.model';
import CategoryRepository from '../../DB/repository/category.repository';
import CategoryService from './category.service';
import CategoryController from './category.controller';

@Module({
  imports: [CategoryModel],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryRepository, CategoryService],
})
export class CategoryModule {}
