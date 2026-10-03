import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../modules-system/database/database.module';
import { CommonAuthModule } from '../../common/auth/common-auth.module';
import { ProblemGeneratorController } from './problem-generator.controller';
import { ProblemGeneratorService } from './problem-generator.service';

@Module({
  imports: [ConfigModule, DatabaseModule, CommonAuthModule],
  controllers: [ProblemGeneratorController],
  providers: [ProblemGeneratorService],
})
export class ProblemGeneratorModule {}
