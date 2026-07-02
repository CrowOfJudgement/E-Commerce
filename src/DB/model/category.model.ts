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
export class Category {
  @Prop({ type: String, required: true, min: 3, trim: true, unique: true })
  name: string;

  @Prop({
    type: String,
    default: function (this: Category) {
      return slugify(this.name || '', { replacement: '-', trim: true, lower: true });
    },
  })
  slug: string;

  @Prop({ type: String })
  image?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  updatedBy: Types.ObjectId;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre('findOneAndUpdate', function () {
  const updated = this.getUpdate() as UpdateQuery<Category>;
  if (updated && (updated as any).name) {
    (updated as any).slug = slugify((updated as any).name, { replacement: '-', trim: true, lower: true });
  }
});

CategorySchema.pre('updateOne', function () {
  const updated = this.getUpdate() as UpdateQuery<Category>;
  if (updated && (updated as any).name) {
    (updated as any).slug = slugify((updated as any).name, { replacement: '-', trim: true, lower: true });
  }
});

export const CategoryModel = MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]);
