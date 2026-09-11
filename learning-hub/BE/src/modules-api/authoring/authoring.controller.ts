import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthoringService } from './authoring.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ImportLessonDto } from './dto/import-lesson.dto';

@Controller('authoring/lessons')
export class AuthoringController {
  constructor(private readonly authoringService: AuthoringService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.authoringService.createLesson(dto);
  }

  @Put(':id')
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.authoringService.updateLesson(id, dto);
  }

  @Get()
  async findAll(@Query('forStudent') forStudent?: string) {
    return this.authoringService.findAll(forStudent === 'true');
  }

  @Get('export/:id')
  async exportLesson(@Param('id') id: string) {
    return this.authoringService.exportLessonJson(id);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  async importLesson(@Body() dto: ImportLessonDto) {
    return this.authoringService.importLessonJson(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.authoringService.findOne(id);
  }

  @Delete(':id')
  async deleteLesson(@Param('id') id: string) {
    return this.authoringService.deleteLesson(id);
  }
}
