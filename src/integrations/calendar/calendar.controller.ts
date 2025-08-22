import { Controller, Post, Param, UseGuards, Request, Get } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('integrations/calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('schedule/:id')
  scheduleTask(@Param('id') id: string, @Request() req) {
    return this.calendarService.scheduleTask(+id, req.user);
  }

  @Post('schedule-all')
  scheduleAllTasks(@Request() req) {
    return this.calendarService.scheduleAllTasks(req.user);
  }

  @Get('import')
  importEventsAsTasks(@Request() req) {
    return this.calendarService.importEventsAsTasks(req.user);
  }
}