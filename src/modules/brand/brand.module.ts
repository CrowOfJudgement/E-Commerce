import { Module } from '@nestjs/common';
import { BrandModel } from '../../DB/model/brand.model';
import BrandRepository from '../../DB/repository/brand.repository';
import BrandService from './brand.service';
import BrandController from './brand.controller';

@Module({
  imports: [BrandModel],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
  exports: [BrandRepository, BrandService],
})
export class BrandModule {}
