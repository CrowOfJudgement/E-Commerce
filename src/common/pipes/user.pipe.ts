import {
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const { success, data, error } = this.schema.safeParse(value);

    if (!success) {
      throw new HttpException(
        {
          message: 'Validation error',
          error: error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return data;
  }
}
