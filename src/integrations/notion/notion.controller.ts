import { Controller, Post, Param, UseGuards, Request, Get } from '@nestjs/common';
import { NotionService } from './notion.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('integrations/notion')
@UseGuards(JwtAuthGuard)
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  @Post('sync/:id')
  syncTaskToNotion(@Param('id') id: string, @Request() req) {
    return this.notionService.syncTaskToNotion(+id, req.user);
  }

  @Post('sync-all')
  syncAllTasksToNotion(@Request() req) {
    return this.notionService.syncAllTasksToNotion(req.user);
  }

  @Get('import')
  importTasksFromNotion(@Request() req) {
    return this.notionService.importTasksFromNotion(req.user);
  }
}