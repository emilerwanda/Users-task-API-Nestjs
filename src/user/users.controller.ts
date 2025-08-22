// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, Delete, ValidationPipe, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Request() req) {
    // Only admin can get all users
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    // Only admin or the user themselves can access user details
    if (req.user.role !== 'admin' && req.user.id !== +id) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    // Only admin can delete users
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.remove(+id);
  }
}