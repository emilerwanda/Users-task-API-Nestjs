import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsObject, IsArray, IsDate } from 'class-validator';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  calendarEventId?: string;

  @IsOptional()
  @IsDate()
  dueDate?: Date; // Changed to Date | undefined to match Task entity

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsObject()
  aiInsights?: object;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  assigneeId?: number | null;

  @IsOptional()
  @IsString()
  notionId?: string; // Added to support notionId
}