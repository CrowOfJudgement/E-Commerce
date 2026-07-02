import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { z } from 'zod';
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from '../../common/enum/user.enum';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
})
export class User {
  @Prop({ type: String, required: true, min: 5, trim: true })
  userName: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ type: Number })
  age?: number;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: String })
  profilePic?: string;

  @Prop({ type: String, enum: GenderEnum, default: GenderEnum.male })
  gender?: GenderEnum;

  @Prop({ type: String, enum: RoleEnum, default: RoleEnum.user })
  role?: RoleEnum;

  @Prop({ type: Boolean, default: false })
  isConfirmed?: boolean;

  @Prop({ type: String, enum: ProviderEnum, default: ProviderEnum.Local })
  provider?: ProviderEnum;

  @Prop({ type: String })
  confirmEmailOtp?: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
export const UserModel = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
]);

export const UserValidationSchema = z.object({
  userName: z.string().trim().min(5),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  phone: z.string().trim().min(7).max(20),
  age: z.number().optional(),
  address: z.string().trim().optional(),
  profilePic: z.string().trim().optional(),
  gender: z.nativeEnum(GenderEnum).optional(),
  role: z.nativeEnum(RoleEnum).optional(),
  isConfirmed: z.boolean().optional(),
  provider: z.nativeEnum(ProviderEnum).optional(),
  confirmEmailOtp: z.string().optional(),
});
