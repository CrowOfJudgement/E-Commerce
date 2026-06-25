import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Store_Enum } from '../../common/enum/multer.enum';
import { ZodValidationPipe } from '../../common/pipes/user.pipe';
import { multerCloud } from '../../common/utils/multer/multer.cloud';
import { CreateUserSchema } from './dto/createUser.dto';
import type { CreateUserDto } from './dto/createUser.dto';
import { SignInSchema } from './dto/signIn.dto';
import type { SignInDto } from './dto/signIn.dto';
import { UserService } from './user.service';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  signUp(@Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserDto) {
    return this.userService.signUp(body);
  }

  @Post('signin')
  signIn(@Body(new ZodValidationPipe(SignInSchema)) body: SignInDto) {
    return this.userService.signIn(body);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('attachment', multerCloud({ store_type: Store_Enum.disk })),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return file;
  }
}
