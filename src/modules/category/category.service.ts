import { Injectable, NotFoundException, ConflictException, Optional } from '@nestjs/common';
import CategoryRepository from '../../DB/repository/category.repository';
import type { createCategoryDto, updateCategoryDto, QueryDto } from './category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository, @Optional() private readonly s3Service?: any) {}

  create(createCategoryDto: createCategoryDto) {
    return this.categoryRepository.create(createCategoryDto as any);
  }

  async createCategory(body: createCategoryDto, file?: Express.Multer.File, user?: { _id?: any }) {
    const { name } = body as createCategoryDto;

    if (await this.categoryRepository.findOne({ filter: { name } })) {
      throw new ConflictException('name already exist');
    }

    const imageUrl: string | undefined = file
      ? this.s3Service && typeof this.s3Service.uploadFile === 'function'
        ? await this.s3Service.uploadFile({ file, path: 'categories' })
        : (file.path as string) || file.filename || undefined
      : undefined;

    const category = await this.categoryRepository.create({
      ...body,
      image: imageUrl ?? body.image,
      createdBy: user?._id,
    } as any);

    return category;
  }

  async findAll(query?: QueryDto) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;

    const filter: any = {};
    if (query?.search) {
      const search = query.search;
      filter.$or = [{ name: { $regex: search, $options: 'i' } }];
    }

    const data = await this.categoryRepository.paginate({ page, limit, filter });
    return data;
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, body: updateCategoryDto, file?: Express.Multer.File, user?: { _id?: any }) {
    const { name } = body;
    const category = await this.categoryRepository.findOne({ filter: { _id: id } });
    if (!category) throw new ConflictException('category not exist');

    if (name && name === (category as any).name) {
      throw new ConflictException('name not change please make any change to update it');
    }

    if (name && (await this.categoryRepository.findOne({ filter: { name } }))) {
      throw new ConflictException('name already exist');
    }

    const imageUrl: string | undefined = file
      ? this.s3Service && typeof this.s3Service.uploadFile === 'function'
        ? await this.s3Service.uploadFile({ file, path: 'categories' })
        : (file.path as string) || file.filename || undefined
      : undefined;

    const update: any = {
      ...(name ? { name } : undefined),
      ...(imageUrl ? { image: imageUrl } : undefined),
      updatedBy: user?._id,
    };

    const updated = await this.categoryRepository.findOneAndUpdate({ filter: { _id: (category as any)._id }, update });
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.categoryRepository.delete(id);
    if (!deleted) throw new NotFoundException('Category not found');
    return { message: 'Category removed' };
  }
}

export default CategoryService;
