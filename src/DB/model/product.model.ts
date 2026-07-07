import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import slugify from 'slugify';
import { User } from './user.model';
import { Brand } from './brand.model';
import { Category } from './category.model';
import { applySoftDeleteQueryHooks } from './plugins/soft-delete.plugin';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class Product {
  @Prop({ type: String, required: true, min: 3, trim: true })
  name: string;

  @Prop({
    type: String,
    default: function (this: Product) {
      return slugify(this.name || '', { replacement: '-', trim: true, lower: true });
    },
  })
  slug: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ type: Types.ObjectId, ref: Brand.name })
  brand: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Category.name })
  category: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre('findOneAndUpdate', function () {
  const updated = this.getUpdate() as UpdateQuery<Product>;
  if (updated && (updated as any).name) {
    (updated as any).slug = slugify((updated as any).name, { replacement: '-', trim: true, lower: true });
  }
});

ProductSchema.pre('updateOne', function () {
  const updated = this.getUpdate() as UpdateQuery<Product>;
  if (updated && (updated as any).name) {
    (updated as any).slug = slugify((updated as any).name, { replacement: '-', trim: true, lower: true });
  }
});

applySoftDeleteQueryHooks(ProductSchema);

export const ProductModel = MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]);
