import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './src/user/entities/user.entity';
import { Task } from './src/tasks/entities/task.entity';

config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? '123',
  database: process.env.DB_NAME ?? 'users-task-nestjs',
  entities: [User, Task],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
