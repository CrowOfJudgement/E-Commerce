import { Injectable, NotFoundException, ConflictException, Optional } from '@nestjs/common';
import ProductRepository from '../../DB/repository/product.repository';
import type { createProductDto, updateProductDto, QueryDto } from './product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository, @Optional() private readonly s3Service?: any) {}

  create(createProductDto: createProductDto) {
    return this.productRepository.create(createProductDto as any);
  }

  async createProduct(body: createProductDto, files?: Express.Multer.File[], user?: { _id?: any }) {
    const { name } = body as createProductDto;

    if (await this.productRepository.findOne({ filter: { name } })) {
      throw new ConflictException('name already exist');
    }

    let images: string[] = body.images ?? [];
    if (files && files.length) {
      const uploads = await Promise.all(
        files.map((file) =>
          this.s3Service && typeof this.s3Service.uploadFile === 'function'
            ? this.s3Service.uploadFile({ file, path: 'products' })
            : Promise.resolve((file.path as string) || file.filename || ''),
        ),
      );
      images = [...images, ...uploads.filter(Boolean)];
    }

    const product = await this.productRepository.create({
      ...body,
      images,
      createdBy: user?._id,
    } as any);

    return product;
  }

  async findAll(query?: QueryDto) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;

    const filter: any = {};
    if (query?.search) {
      const search = query.search;
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (query?.brand) filter.brand = query.brand;
    if (query?.category) filter.category = query.category;

    const data = await this.productRepository.paginate({ page, limit, filter });
    return data;
  }

  async findOne(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, body: updateProductDto, files?: Express.Multer.File[], user?: { _id?: any }) {
    const { name } = body;
    const product = await this.productRepository.findOne({ filter: { _id: id } });
    if (!product) throw new ConflictException('product not exist');

    if (name && name === (product as any).name) {
      throw new ConflictException('name not change please make any change to update it');
    }

    if (name && (await this.productRepository.findOne({ filter: { name } }))) {
      throw new ConflictException('name already exist');
    }

    let images: string[] | undefined = undefined;
    if (files && files.length) {
      const uploads = await Promise.all(
        files.map((file) =>
          this.s3Service && typeof this.s3Service.uploadFile === 'function'
            ? this.s3Service.uploadFile({ file, path: 'products' })
            : Promise.resolve((file.path as string) || file.filename || ''),
        ),
      );
      images = uploads.filter(Boolean);
    }

    const update: any = {
      ...(name ? { name } : undefined),
      ...(body.description ? { description: body.description } : undefined),
      ...(typeof body.price === 'number' ? { price: body.price } : undefined),
      ...(typeof body.stock === 'number' ? { stock: body.stock } : undefined),
      ...(body.brand ? { brand: body.brand } : undefined),
      ...(body.category ? { category: body.category } : undefined),
      ...(images ? { images } : undefined),
      updatedBy: user?._id,
    };

    const updated = await this.productRepository.findOneAndUpdate({ filter: { _id: (product as any)._id }, update });
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.productRepository.delete(id);
    if (!deleted) throw new NotFoundException('Product not found');
    return { message: 'Product removed' };
  }
}

export default ProductService;
