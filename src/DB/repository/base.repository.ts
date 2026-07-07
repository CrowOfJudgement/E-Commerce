import {
  HydratedDocument,
  Model,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';

export default class BaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data);
  }

  find({
    filter = {},
    projection,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  } = {}): Promise<HydratedDocument<TDocument>[]> {
    return this.model.find(filter, projection, options).exec();
  }

  findOne({
    filter = {},
    projection,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    projection?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne(filter, projection, options).exec();
  }

  findById(id: string): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findById(id).exec();
  }

  findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndUpdate(filter, update, options).exec();
  }

  update(
    id: string,
    data: UpdateQuery<TDocument>,
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  delete(id: string): Promise<HydratedDocument<TDocument> | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() } as UpdateQuery<TDocument>,
        { new: true },
      )
      .exec();
  }

  async paginate({
    filter = {},
    projection,
    page = 1,
    limit = 10,
    options,
  }: {
    filter?: QueryFilter<TDocument>;
    projection?: ProjectionType<TDocument>;
    page?: number;
    limit?: number;
    options?: QueryOptions<TDocument>;
  }): Promise<{
    data: HydratedDocument<TDocument>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pg = page && page > 0 ? page : 1;
    const lim = limit && limit > 0 ? limit : 10;
    const skip = (pg - 1) * lim;

    const [total, data] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model.find(filter, projection, { ...options, skip, limit: lim }).exec(),
    ]);

    const totalPages = Math.ceil(total / lim) || 1;

    return { data, total, page: pg, limit: lim, totalPages };
  }
}
