import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerCloud } from '../../common/utils/multer/multer.cloud';
import { Store_Enum } from '../../common/enum/multer.enum';
import { createCategoryDto, updateCategoryDto, QueryDto } from './category.dto';
import CategoryService from './category.service';
import { User } from '../../common/decorator/user.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('attachment', multerCloud({ store_type: Store_Enum.disk })))
  create(
    @Body(new ValidationPipe({ whitelist: true })) body: createCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: any,
  ) {
    const user = req?.user;
    return this.categoryService.createCategory(body, file, user);
  }

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('attachment', multerCloud({ store_type: Store_Enum.disk })))
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) body: updateCategoryDto,
    @User() user?: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.categoryService.update(id, body, file, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}

export default CategoryController;
