import { Module } from '@nestjs/common';
import { NotionModule } from './notion/notion.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [NotionModule, CalendarModule],
  exports: [NotionModule, CalendarModule],
})
export class IntegrationsModule {}