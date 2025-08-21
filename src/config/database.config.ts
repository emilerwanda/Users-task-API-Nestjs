import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';

export class DatabaseConfig {
  static getOrmConfig(configService: ConfigService): TypeOrmModuleOptions {
    const isProd = configService.get<string>('NODE_ENV') === 'production';

    return {
      type: 'postgres',
      host: configService.get<string>('DB_HOST') ?? 'localhost',
      port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
      username: configService.get<string>('DB_USER') ?? 'postgres',
      password: configService.get<string>('DB_PASS') ?? '123',
      database: configService.get<string>('DB_NAME') ?? 'users-task-nestjs',
      entities: [User, Task],
      synchronize: !isProd,     // ✅ true only in dev
      autoLoadEntities: true,
      migrations: ['dist/migrations/*.js'], // prod migration support
    };
  }
}
