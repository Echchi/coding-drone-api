import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructorModule } from './instructor/instructor.module';
import { LecturesModule } from './lectures/lectures.module';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';
import { Instructor } from './instructor/entities/instructor.entity';
import { Lectures } from './lectures/entities/lectures.entitiy';
import { Students } from './students/entities/students.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Instructor, Lectures, Students],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    InstructorModule,
    LecturesModule,
    StudentsModule,
    AuthModule,
  ],
})
export class AppModule {}
