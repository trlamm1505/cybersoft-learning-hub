import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { INITIAL_EXERCISES } from './initial-exercises';
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
  } catch (error) {
    console.error('❌ Seeding Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedExercises();
