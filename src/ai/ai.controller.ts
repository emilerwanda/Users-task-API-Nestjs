import { Controller, Get, Param, UseGuards, Request, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-task/:id')
  analyzeTask(@Param('id') id: string, @Request() req) {
    return this.aiService.analyzeTask(+id, req.user);
  }

  @Get('dashboard-insights')
  getDashboardInsights(@Request() req) {
    return this.aiService.generateDashboardInsights(req.user);
  }
}