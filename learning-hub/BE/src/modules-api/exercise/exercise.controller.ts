import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';

@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  /**
   * GET /api/exercises
   */
  @Get()
  async findAll() {
    return this.exerciseService.findAll();
  }

  /**
   * GET /api/exercises/:slug
   */
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.exerciseService.findBySlug(slug);
  }

  /**
   * POST /api/exercises/:slug/run
   */
  @Post(':slug/run')
  async runCode(@Param('slug') slug: string, @Body() dto: RunCodeDto) {
    return this.exerciseService.runCode(slug, dto);
  }

  /**
   * POST /api/exercises/:slug/submit
   */
  @Post(':slug/submit')
  async submitCode(@Param('slug') slug: string, @Body() dto: SubmitCodeDto) {
    return this.exerciseService.submitCode(slug, dto);
  }
}
