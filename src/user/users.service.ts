import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  // Create new user
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with this email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password!, 10);
    
    // Create and save the new user
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    
    return await this.usersRepository.save(user);
  }

  // Get all users
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  // Get user by ID with their tasks
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['tasks'], // This loads the user's tasks too
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  // Delete user
  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    const result = await this.usersRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const updatedUser = await this.usersRepository.findOne({ where: { id } });
    // TypeScript knows updatedUser exists because update succeeded, but we double-check
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found after update`);
    }
    return updatedUser as User; // Explicit type assertion for TypeScript
  }

}