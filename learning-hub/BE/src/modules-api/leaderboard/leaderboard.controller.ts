import { Controller, Get, Param, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('contests')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string, @Query('asTeacher') asTeacher?: string) {
    return this.leaderboardService.computeLeaderboard(id, { asTeacher: asTeacher === 'true' });
  }

  @Get(':id/leaderboard/rules')
  async getRules(@Param('id') id: string) {
    return this.leaderboardService.getRules(id);
  }
}
