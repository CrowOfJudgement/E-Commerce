import { IsNotEmpty, IsString, Length, IsOptional, IsNumber, IsPositive, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { AtLeastOne } from '../../common/decorator/brand.decorator';

export class createProductDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 1000)
  description: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsMongoId()
  brand?: string;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}

@AtLeastOne(['name', 'description', 'price', 'stock', 'brand', 'category', 'images'])
export class updateProductDto {
  @IsOptional()
  @IsString()
  @Length(3, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 1000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsMongoId()
  brand?: string;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}

export class QueryDto {
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number;

  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  brand?: string;

  @IsOptional()
  @IsMongoId()
  category?: string;
}
