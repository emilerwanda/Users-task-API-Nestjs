import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsNumber()
  userId: number;
}