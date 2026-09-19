import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, type: String, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, type: String })
  password: string; // bcrypt hash, never returned in API responses

  @Prop({ required: true, type: String, trim: true })
  fullName: string;

  // ADMIN chỉ được tạo qua seed script, không cho tự đăng ký qua form Register
  // (xem RegisterDto/AuthService.register — chỉ chấp nhận STUDENT/TEACHER).
  @Prop({ type: String, enum: ['STUDENT', 'TEACHER', 'ADMIN'], default: 'STUDENT' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
