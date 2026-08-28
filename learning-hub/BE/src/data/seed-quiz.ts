import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { INITIAL_QUIZ_QUESTIONS } from './initial-quiz-questions';
import { QuestionSchema } from '../modules-system/database/schemas/question.schema';
import { QuizAttemptSchema } from '../modules-system/database/schemas/quiz-attempt.schema';

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/cybersoft';

// User and Test Schemas for seeding reference
const userSchema = new mongoose.Schema({ email: String, fullName: String });
const testSchema = new mongoose.Schema({ exerciseId: mongoose.Schema.Types.ObjectId, version: Number });

async function seedQuizEngine() {
  console.log('🌱 [Quiz Engine Seed] Connecting to MongoDB:', MONGO_URI);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    const QuestionModel = mongoose.model('Question', QuestionSchema);
    const QuizAttemptModel = mongoose.model('QuizAttempt', QuizAttemptSchema);
    const UserModel = mongoose.model('User', userSchema);
    const TestModel = mongoose.model('Test', testSchema);

    // 1. Clean existing questions and quiz attempts collections
    await QuestionModel.deleteMany({});
    await QuizAttemptModel.deleteMany({});
    console.log('🧹 Cleaned existing "questions" and "quizattempts" collections');

    // 2. Insert 20 Quiz Questions
    const createdQuestions = await QuestionModel.insertMany(INITIAL_QUIZ_QUESTIONS);
    console.log(`✅ Seeded ${createdQuestions.length} Quiz Questions with detailed explanations!`);

    // 3. Find sample Student User & Test for Attempt creation
    const studentUser = await UserModel.findOne({ email: 'student@gmail.com' });
    const sampleTest = await TestModel.findOne({});

    if (studentUser && sampleTest) {
      // 4. Generate sample QuizAttempt for Student
      const sampleSeed = 'cybersoft-seed-2026-quiz-attempt-01';
      const shuffledQuestionItems = createdQuestions.slice(0, 10).map((q: any, idx: number) => {
        const optionKeys = q.options.map((opt: any) => opt.key);
        const rotatedKeys = [...optionKeys.slice(idx % 4), ...optionKeys.slice(0, idx % 4)];
        const correctOpt = q.options.find((opt: any) => opt.isCorrect);

        return {
          questionId: q._id,
          optionKeysOrder: rotatedKeys,
          selectedOptionKey: correctOpt ? correctOpt.key : 'A',
          isCorrect: true,
          scoreEarned: q.points || 10,
        };
      });

      const totalScore = shuffledQuestionItems.reduce((acc, curr) => acc + (curr.scoreEarned || 0), 0);

      const sampleAttemptPayload: any = {
        userId: studentUser._id,
        testId: sampleTest._id,
        seed: sampleSeed,
        shuffledQuestions: shuffledQuestionItems,
        startedAt: new Date(Date.now() - 15 * 60 * 1000), // Started 15 mins ago
        submittedAt: new Date(),
        timeLimitSeconds: 1800,
        status: 'GRADED',
        score: totalScore,
        maxScore: 100,
      };

      const sampleAttempt: any = await QuizAttemptModel.create(sampleAttemptPayload);

      console.log(`✅ Created sample QuizAttempt for Student (${studentUser.email}): Score ${sampleAttempt.score}/${sampleAttempt.maxScore}`);
    }

    console.log('🎉 QUIZ ENGINE SEEDING COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Quiz Engine Seeding Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedQuizEngine();
