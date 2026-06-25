import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Request } from 'express';
import multer from 'multer';
import { tmpdir } from 'node:os';
import { Store_Enum } from '../../enum/multer.enum';

export function multerCloud({
  store_type = Store_Enum.disk,
  custom_types = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 1024 * 1024 * 5,
}: {
  store_type?: Store_Enum;
  custom_types?: string[];
  maxFileSize?: number;
}): MulterOptions {
  const storage =
    store_type === Store_Enum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: (
            req: Request,
            file: Express.Multer.File,
            cb: (error: Error | null, filename: string) => void,
          ) => {
            void req;
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);

            cb(null, uniqueSuffix + '-' + file.originalname);
          },
        });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) {
    void req;

    if (!custom_types.includes(file.mimetype)) {
      cb(new BadRequestException('Invalid file type'));
    } else {
      cb(null, true);
    }
  }

  return {
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
    },
  };
}
