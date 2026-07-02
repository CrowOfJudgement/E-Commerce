import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import slugify from 'slugify';
import { User } from './user.model';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Brand {
  @Prop({ type: String, required: true, min: 5, trim: true, unique: true })
  name: string;

  @Prop({
    type: String,
    default: function (this: Brand) {
      return slugify(this.name || '', { replacement: '-', trim: true, lower: true });
    },
  })
  slug: string;

  @Prop({ type: String, required: true })
  logo: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  updatedBy: Types.ObjectId;
}

export type BrandDocument = HydratedDocument<Brand>;
export const BrandSchema = SchemaFactory.createForClass(Brand);
BrandSchema.pre('findOneAndUpdate', function () {
  const updated = this.getUpdate() as UpdateQuery<Brand>;
  if (updated && (updated as any).name) {
    (updated as any).slug = slugify((updated as any).name, { replacement: '-', trim: true, lower: true });
  }
});

BrandSchema.pre('updateOne', function () {
  const updated = this.getUpdate() as UpdateQuery<Brand>;
  if (updated && (updated as any).name) {
    (updated as any).slug = slugify((updated as any).name, { replacement: '-', trim: true, lower: true });
  }
});
export const BrandModel = MongooseModule.forFeature([
  { name: Brand.name, schema: BrandSchema },
]);
