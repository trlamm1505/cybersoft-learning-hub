import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { MAX_ARTIFACT_BYTES } from './artifact-upload.service';
import type { UploadedArtifact } from './artifact-upload.service';
import { TesterLabsService } from './tester-labs.service';
import type { ReviewInput } from './tester-labs.service';

@Controller('tester-labs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TesterLabsController {
  constructor(private readonly service: TesterLabsService) {}

  @Get()
  listLabs() {
    return this.service.listLabs();
  }

  @Get(':labCode')
  getLab(@Param('labCode') labCode: string) {
    return this.service.getLab(labCode);
  }

  @Get(':labCode/files/:name')
  async downloadAsset(
    @Param('labCode') labCode: string,
    @Param('name') name: string,
    @Res() res: Response,
  ) {
    res.download(await this.service.getAssetPath(labCode, name), name);
  }

  @Post(':labCode/submissions')
  @Roles('STUDENT')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_ARTIFACT_BYTES } }),
  )
  submit(
    @Param('labCode') labCode: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: UploadedArtifact,
  ) {
    return this.service.submit(labCode, user.sub, file);
  }

  @Get(':labCode/submissions/mine')
  listMine(
    @Param('labCode') labCode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.listMine(labCode, user.sub);
  }

  @Get(':labCode/submissions')
  listReviewable(
    @Param('labCode') labCode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.listReviewable(labCode, user);
  }

  @Get('submissions/:id/artifact')
  async downloadArtifact(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    res.download(await this.service.getArtifactPath(id, user));
  }

  @Put('submissions/:id/review')
  review(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: ReviewInput,
  ) {
    return this.service.review(id, user, body);
  }
}
