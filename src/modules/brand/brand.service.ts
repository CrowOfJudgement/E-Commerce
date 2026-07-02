import {
  Injectable,
  NotFoundException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import BrandRepository from '../../DB/repository/brand.repository';
import type { createBrandDto, updateBrandDto, QueryDto } from './brand.dto';

@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepository: BrandRepository,
    @Optional() private readonly s3Service?: any,
  ) {}

  create(createBrandDto: createBrandDto) {
    return this.brandRepository.create(createBrandDto as any);
  }

  async createBrand(
    body: createBrandDto,
    file?: Express.Multer.File,
    user?: { _id?: any },
  ) {
    const { name } = body as createBrandDto;

    if (await this.brandRepository.findOne({ filter: { name } })) {
      throw new ConflictException('name already exist');
    }

    const logoUrl: string | undefined = file
      ? this.s3Service && typeof this.s3Service.uploadFile === 'function'
        ? await this.s3Service.uploadFile({ file, path: 'brands' })
        : (file.path as string) || file.filename || undefined
      : undefined;

    const brand = await this.brandRepository.create({
      ...body,
      logo: logoUrl ?? body.logo,
      createdBy: user?._id,
    } as any);

    return brand;
  }

  async findAll(query?: QueryDto) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;

    const filter: any = {};
    if (query?.search) {
      const search = query.search;
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slogan: { $regex: search, $options: 'i' } },
      ];
    }

    const data = await this.brandRepository.paginate({ page, limit, filter });
    return data;
  }

  async findOne(id: string) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  

  async update(id: string, body: updateBrandDto, file?: Express.Multer.File, user?: { _id?: any }) {
    const { name, slogan } = body;
    const brand = await this.brandRepository.findOne({ filter: { _id: id } });
    if (!brand) throw new ConflictException('brand not exist');

    if (name && name === (brand as any).name) {
      throw new ConflictException('name not change please make any change to update it');
    }

    if (name && (await this.brandRepository.findOne({ filter: { name } }))) {
      throw new ConflictException('name already exist');
    }

    const logoUrl: string | undefined = file
      ? this.s3Service && typeof this.s3Service.uploadFile === 'function'
        ? await this.s3Service.uploadFile({ file, path: 'brands' })
        : (file.path as string) || file.filename || undefined
      : undefined;

    const update: any = {
      ...(name ? { name } : undefined),
      ...(slogan ? { slogan } : undefined),
      ...(logoUrl ? { logo: logoUrl } : undefined),
      updatedBy: user?._id,
    };

    const updated = await this.brandRepository.findOneAndUpdate({ filter: { _id: (brand as any)._id }, update });
    if (!updated) throw new NotFoundException('Brand not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.brandRepository.delete(id);
    if (!deleted) throw new NotFoundException('Brand not found');
    return { message: 'Brand removed' };
  }
}

export default BrandService;
