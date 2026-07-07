import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { BrandModule } from './modules/brand/brand.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env', '.env.production'],
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!, {
      onConnectionCreate: (connection: Connection) => {
        connection.on('connected', () => {
          console.log('MongoDB connected successfully');
        });

        connection.on('error', (error) => {
          console.error('MongoDB connection failed', error);
        });

        return connection;
      },
    }),
    UserModule,
    // Brand module for BrandModel & repository
    BrandModule,
    // Category module
    CategoryModule,
    // Product module
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
