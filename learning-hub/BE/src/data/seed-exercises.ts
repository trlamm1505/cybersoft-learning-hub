import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { INITIAL_EXERCISES } from './initial-exercises';
import { INITIAL_EXERCISES_DAY14 } from './initial-exercises-day14';
import { INITIAL_EXERCISES_DAY15 } from './initial-exercises-day15';
import { ExerciseSchema } from '../modules-system/database/schemas/exercise.schema';
import { SubmissionSchema } from '../modules-system/database/schemas/submission.schema';

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/cybersoft';

async function seedExercises() {
  console.log('🌱 [Code Playground Seed] Connecting to MongoDB:', MONGO_URI);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    const ExerciseModel = mongoose.model('Exercise', ExerciseSchema);
    const SubmissionModel = mongoose.model('Submission', SubmissionSchema);

    await ExerciseModel.deleteMany({});
    await SubmissionModel.deleteMany({});
    console.log('🧹 Cleaned existing "exercises" and "submissions" collections');

    const created = await ExerciseModel.insertMany(INITIAL_EXERCISES);
    console.log(`✅ Seeded ${created.length} Python sample exercises for Code Playground`);

    const createdDay14 = await ExerciseModel.insertMany(INITIAL_EXERCISES_DAY14);
    console.log(`✅ Seeded ${createdDay14.length} Day 14 exercises (grades 6-9) for Code Playground`);

    const createdDay15 = await ExerciseModel.insertMany(INITIAL_EXERCISES_DAY15);
    console.log(`✅ Seeded ${createdDay15.length} Day 15 exercises (grades 10-12) for Code Playground`);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedExercises();
