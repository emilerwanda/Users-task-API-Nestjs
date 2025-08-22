// src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) { }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const taskData = {
      ...createTaskDto,
      tags: createTaskDto.tags || [],
    };
    const task = this.tasksRepository.create(taskData);
    return await this.tasksRepository.save(task);
  }

  async findAll(user: any, opts?: { page: number; limit: number }): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, opts?.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts?.limit ?? 10));
    const skip = (page - 1) * limit;
    // If user is admin, return all tasks
    if (user.role === 'admin') {
      const [data, total] = await this.tasksRepository.findAndCount({
        relations: ['user'], // Include user information
        order: { id: 'DESC' },
        take: limit,
        skip,
      });
      return { data, total, page, limit };
    }

    // If user is normal, return only their tasks
    const [data, total] = await this.tasksRepository.findAndCount({
      where: { userId: user.id },
      relations: ['user'],
      order: { id: 'DESC' },
      take: limit,
      skip,
    });
    return { data, total, page, limit };
  }

  async findOne(id: number, user: any): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check if user is admin or the owner of the task
    if (user.role !== 'admin' && task.userId !== user.id) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: any): Promise<Task> {
    const task = await this.findOne(id, user);
    Object.assign(task, updateTaskDto);
    return await this.tasksRepository.save(task);
  }

  async remove(id: number, user: any): Promise<void> {
    // First check if the user can access this task
    await this.findOne(id, user);

    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}