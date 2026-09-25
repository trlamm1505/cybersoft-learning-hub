import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({
    required: true,
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({ required: true, type: String })
  password: string; // bcrypt hash, never returned in API responses

  @Prop({ required: true, type: String, trim: true })
  fullName: string;

  // ADMIN chỉ được tạo qua seed script, không cho tự đăng ký qua form Register
  // (xem RegisterDto/AuthService.register — chỉ chấp nhận STUDENT/TEACHER).
  @Prop({
    type: String,
    enum: ['STUDENT', 'TEACHER', 'ADMIN'],
    default: 'STUDENT',
  })
  role: string;

  // Chỉ có ý nghĩa với role STUDENT — dùng để cá nhân hóa trải nghiệm học
  // theo lứa tuổi (khác UI/độ khó cho 3-5 so với 10-12) và tách bảng xếp
  // hạng theo nhóm tuổi khi cần.
  @Prop({ type: String, enum: ['3-5', '6-9', '10-12'] })
  ageGroup?: '3-5' | '6-9' | '10-12';

  // Mã học viên hiển thị công khai trên bảng xếp hạng (Cxxxx), chỉ sinh cho
  // STUDENT — TEACHER/ADMIN không cần mã này. Sinh tuần tự qua Counter
  // collection (xem AuthService.generateNextStudentCode), unique + sparse để
  // TEACHER/ADMIN (không có field này) không vi phạm unique index.
  @Prop({ type: String, unique: true, sparse: true })
  studentCode?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
