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
import { createBrandDto, updateBrandDto, QueryDto } from './brand.dto';
import BrandService from './brand.service';
import { User } from '../../common/decorator/user.decorator';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('attachment', multerCloud({ store_type: Store_Enum.disk })),
  )
  create(
    @Body(new ValidationPipe({ whitelist: true })) body: createBrandDto,
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: any,
  ) {
    const user = req?.user;
    return this.brandService.createBrand(body, file, user);
  }

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryDto) {
    return this.brandService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('attachment', multerCloud({ store_type: Store_Enum.disk })))
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) body: updateBrandDto,
    @User() user?: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.brandService.update(id, body, file, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }

  
}

export default BrandController;
