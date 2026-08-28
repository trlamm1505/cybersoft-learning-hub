import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Question, QuestionSchema } from './schemas/question.schema';
import { QuizAttempt, QuizAttemptSchema } from './schemas/quiz-attempt.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL') || 'mongodb://localhost:27017/cybersoft',
      }),
    }),
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
