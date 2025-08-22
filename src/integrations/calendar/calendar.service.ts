import { Injectable, Logger, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TasksService } from '../../tasks/tasks.service';
import { Task } from '../../tasks/entities/task.entity';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity'; // Adjust path to your User entity

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private tasksService: TasksService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create OAuth2 client for a user
   */
  private async getOAuthClient(userId: any): Promise<OAuth2Client> {
    const user = await this.userRepository.findOne({ where: { id: userId.id } });

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      this.logger.warn(`No Google Calendar credentials for user ${userId.id}`);
      throw new UnauthorizedException('User has not connected Google Calendar');
    }

    const oauth2Client = new OAuth2Client({
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    });

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await this.userRepository.update(user.id, {
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
        });
        this.logger.log(`Updated Google tokens for user ${user.id}`);
      }
    });

    return oauth2Client;
  }

  /**
   * Schedule a task in the user's calendar
   */
  async scheduleTask(taskId: number, userId: any): Promise<Task> {
    const task = await this.tasksService.findOne(taskId, userId);

    if (!task.dueDate) {
      this.logger.warn(`Task ${taskId} has no due date, cannot schedule in calendar`);
      throw new BadRequestException('Task has no due date');
    }

    try {
      const oauth2Client = await this.getOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const calendarEventId = await this.createCalendarEvent(task, calendar);

      return await this.tasksService.update(taskId, { calendarEventId }, userId);
    } catch (error) {
      this.logger.error(`Failed to schedule task ${taskId} for user ${userId.id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to schedule in calendar');
    }
  }

  /**
   * Schedule all tasks for a user in their calendar
   */
  async scheduleAllTasks(userId: any): Promise<Task[]> {
    const tasks = await this.tasksService.findAll(userId);
    const updatedTasks: Task[] = [];
    const oauth2Client = await this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await Promise.all(
      tasks.data.map(async (task) => {
        if (!task.calendarEventId && task.dueDate) {
          try {
            const calendarEventId = await this.createCalendarEvent(task, calendar);
            const updatedTask = await this.tasksService.update(task.id, { calendarEventId }, userId);
            updatedTasks.push(updatedTask);
          } catch (error) {
            this.logger.error(`Failed to schedule task ${task.id}: ${error.message}`);
            updatedTasks.push(task); // Push original on failure
          }
        } else {
          updatedTasks.push(task);
        }
      }),
    );

    return updatedTasks;
  }

  /**
   * Import events from user's calendar as tasks
   */
  async importEventsAsTasks(userId: any): Promise<Task[]> {
    try {
      const oauth2Client = await this.getOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const calendarEvents = await this.fetchCalendarEvents(calendar);
      const importedTasks: Task[] = [];

      for (const event of calendarEvents) {
        const taskData = {
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          userId: userId.id,
          calendarEventId: event.id,
          dueDate: event.start?.dateTime ? new Date(event.start.dateTime) : undefined,
        };

        if (taskData.dueDate) {
          const task = await this.tasksService.create(taskData);
          importedTasks.push(task);
        }
      }

      return importedTasks;
    } catch (error) {
      this.logger.error(`Failed to import events for user ${userId.id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to import from calendar');
    }
  }

  /**
   * Create a calendar event for a task
   */
  private async createCalendarEvent(task: Task, calendar: any): Promise<string> {
    this.logger.log(`Creating calendar event for task: ${task.title}`);

    const event = {
      summary: task.title,
      description: task.description,
      start: {
        dateTime: task.dueDate.toISOString(),
        timeZone: 'UTC', // Adjust based on user preference
      },
      end: {
        dateTime: new Date(task.dueDate.getTime() + 60 * 60 * 1000).toISOString(), // 1-hour duration
        timeZone: 'UTC',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary', // User's primary calendar
      resource: event,
    });

    return response.data.id;
  }

  /**
   * Fetch calendar events for a user
   */
  private async fetchCalendarEvents(calendar: any): Promise<any[]> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: oneWeekAgo.toISOString(),
      timeMax: now.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  }
}