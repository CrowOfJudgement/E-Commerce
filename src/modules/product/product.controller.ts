import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
  Req,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerCloud } from '../../common/utils/multer/multer.cloud';
import { Store_Enum } from '../../common/enum/multer.enum';
import { createProductDto, updateProductDto, QueryDto } from './product.dto';
import ProductService from './product.service';
import { User } from '../../common/decorator/user.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('attachments', 10, multerCloud({ store_type: Store_Enum.disk })))
  create(
    @Body(new ValidationPipe({ whitelist: true })) body: createProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
    @Req() req?: any,
  ) {
    const user = req?.user;
    return this.productService.createProduct(body, files, user);
  }

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('attachments', 10, multerCloud({ store_type: Store_Enum.disk })))
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) body: updateProductDto,
    @User() user?: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productService.update(id, body, files, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}

export default ProductController;
