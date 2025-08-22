// src/tasks/tasks.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, UseGuards, Request, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  create(@Body(ValidationPipe) createTaskDto: CreateTaskDto, @Request() req) {
    // enforce ownership: default userId from token if missing
    const payload = { ...createTaskDto } as any;
    if (payload.userId == null) {
      payload.userId = req.user.id;
    }
    return this.tasksService.create(payload);
  }

  @Get()
  findAll(@Request() req, @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.tasksService.findAll(req.user, { page: parseInt(page, 10), limit: parseInt(limit, 10) });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(+id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(ValidationPipe) updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.tasksService.update(+id, updateTaskDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.tasksService.remove(+id, req.user);
  }
}