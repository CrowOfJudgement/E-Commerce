import { IsNotEmpty, IsString, Length, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { AtLeastOne } from '../../common/decorator/brand.decorator';

export class createBrandDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  slogan: string;

  @IsOptional()
  @IsString()
  @Length(3, 200)
  logo?: string;
}

@AtLeastOne(['name', 'slogan'])
export class updateBrandDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  slogan?: string;

  @IsOptional()
  @IsString()
  @Length(3, 200)
  logo?: string;
}

export class QueryDto {
  @IsOptional()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
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
}
