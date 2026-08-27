import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { INITIAL_USERS, INITIAL_COURSES } from './initial-data';

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/cybersoft';

// --------------------------------------------------------
// MONGOOSE SCHEMAS FOR ALL 8 CORE TABLES
// --------------------------------------------------------

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'TEACHER', 'STUDENT'], default: 'STUDENT' },
  avatar: String,
  bio: String,
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  thumbnail: String,
  level: { type: String, enum: ['KID', 'TEEN', 'PRO', 'ADULT'], default: 'TEEN' },
  isPublished: { type: Boolean, default: false },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const lessonSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  content: String,
  videoUrl: String,
  orderIndex: { type: Number, default: 0 },
}, { timestamps: true });

const exerciseSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['QUIZ', 'CODE_BLOCK', 'CODE_TEXT', 'SQL_LAB'], default: 'CODE_TEXT' },
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'EASY' },
  points: { type: Number, default: 10 },
  starterCode: String,
  solutionCode: String,
}, { timestamps: true });

const testSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: Boolean,
  }],
  timeLimitMs: { type: Number, default: 2000 },
  memoryLimitMb: { type: Number, default: 128 },
}, { timestamps: true });

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
}, { timestamps: true });

const submissionSchema = new mongoose.Schema({
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  code: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PASSED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'PENDING'], 
    default: 'PENDING' 
  },
  executionTimeMs: Number,
  memoryUsedMb: Number,
  errorMessage: String,
}, { timestamps: true });

const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 100 },
  attemptsCount: { type: Number, default: 0 },
  isPassed: { type: Boolean, default: false },
  lastGradedAt: { type: Date, default: Date.now },
}, { timestamps: true });

async function seed() {
  console.log('🌱 Connecting to MongoDB:', MONGO_URI);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    const User = mongoose.model('User', userSchema);
    const Course = mongoose.model('Course', courseSchema);
    const Lesson = mongoose.model('Lesson', lessonSchema);
    const Exercise = mongoose.model('Exercise', exerciseSchema);
    const Test = mongoose.model('Test', testSchema);
    const Attempt = mongoose.model('Attempt', attemptSchema);
    const Submission = mongoose.model('Submission', submissionSchema);
    const Score = mongoose.model('Score', scoreSchema);

    // 1. Clean existing 8 collections
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Exercise.deleteMany({});
    await Test.deleteMany({});
    await Attempt.deleteMany({});
    await Submission.deleteMany({});
    await Score.deleteMany({});
    console.log('🧹 Cleaned all 8 MongoDB collections');

    // 2. Create Users
    const userMap = new Map<string, mongoose.Types.ObjectId>();

    for (const userData of INITIAL_USERS) {
      const hashedPassword = await bcrypt.hash(userData.passwordRaw, 10);
      const user: any = await User.create({
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        role: userData.role as any,
        bio: userData.bio,
        avatar: userData.avatar,
      });
      userMap.set(userData.email, user._id);
    }
    console.log(`✅ Created 3 Users (Admin, Teacher, Student)`);

    const studentId = userMap.get('student@gmail.com');

    // 3. Create Courses, Lessons, Exercises, Tests
    for (const courseData of INITIAL_COURSES) {
      const authorId = userMap.get(courseData.authorEmail);
      if (!authorId) continue;

      const course: any = await Course.create({
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        level: courseData.level as any,
        isPublished: courseData.isPublished,
        authorId: authorId,
      });

      for (const lessonData of courseData.lessons) {
        const lesson: any = await Lesson.create({
          courseId: course._id,
          title: lessonData.title,
          slug: lessonData.slug,
          content: lessonData.content,
          videoUrl: 'videoUrl' in lessonData ? (lessonData as any).videoUrl : undefined,
          orderIndex: lessonData.orderIndex,
        });

        for (const exerciseData of lessonData.exercises) {
          const exercise: any = await Exercise.create({
            lessonId: lesson._id,
            title: exerciseData.title,
            slug: exerciseData.slug,
            description: exerciseData.description,
            type: exerciseData.type as any,
            difficulty: exerciseData.difficulty as any,
            points: exerciseData.points,
            starterCode: exerciseData.starterCode,
            solutionCode: exerciseData.solutionCode,
          });

          let testDoc: any = null;
          if (exerciseData.testCases && exerciseData.testCases.length > 0) {
            testDoc = await Test.create({
              exerciseId: exercise._id,
              version: 1,
              isActive: true,
              testCases: exerciseData.testCases,
            });
          }

          // 4. Create Sample Attempts, Submissions & Scores for Student
          if (studentId) {
            const attempt: any = await Attempt.create({
              userId: studentId,
              exerciseId: exercise._id,
              code: exerciseData.solutionCode || 'print("Hello CyberSoft")',
              status: 'COMPLETED',
            });

            await Submission.create({
              attemptId: attempt._id,
              userId: studentId,
              exerciseId: exercise._id,
              testId: testDoc ? testDoc._id : undefined,
              code: exerciseData.solutionCode || 'print("Hello CyberSoft")',
              status: 'PASSED',
              executionTimeMs: 45,
              memoryUsedMb: 12,
            });

            await Score.create({
              userId: studentId,
              exerciseId: exercise._id,
              score: exerciseData.points,
              maxScore: 100,
              attemptsCount: 1,
              isPassed: true,
            });
          }
        }
      }
      console.log(`✅ Created Course, Exercises, Attempts, Submissions & Scores: "${course.title}"`);
    }

    console.log('🎉 ALL 8 MONGODB CORE TABLES SEEDED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Seeding Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
