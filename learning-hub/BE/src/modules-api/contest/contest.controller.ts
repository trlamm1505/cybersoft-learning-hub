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
import { ContestService } from './contest.service';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { RegisterContestDto } from './dto/register-contest.dto';

@Controller('contests')
export class ContestController {
  constructor(private readonly contestService: ContestService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createContestLegacy(@Body() dto: CreateContestDto) {
    return this.contestService.createContest(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createContest(@Body() dto: CreateContestDto) {
    return this.contestService.createContest(dto);
  }

  @Put(':id')
  async updateContest(@Param('id') id: string, @Body() dto: UpdateContestDto) {
    return this.contestService.updateContest(id, dto);
  }

  @Get()
  async findAll(@Query('studentId') studentId?: string) {
    return this.contestService.findAll(studentId);
  }

  @Get(':id/status')
  async checkStatus(@Param('id') id: string, @Query('studentId') studentId?: string) {
    return this.contestService.checkContestStatus(id, studentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('studentId') studentId?: string) {
    return this.contestService.findOne(id, studentId);
  }

  @Post(':id/register')
  @HttpCode(HttpStatus.OK)
  async registerContest(@Param('id') id: string, @Body() dto: RegisterContestDto) {
    return this.contestService.registerContest(id, dto);
  }

  @Delete(':id')
  async deleteContest(@Param('id') id: string) {
    return this.contestService.deleteContest(id);
  }
}
