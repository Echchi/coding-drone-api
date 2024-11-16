import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [Instructor, Lectures, Students],
      synchronize: true,
    }),
    InstructorModule,
    LecturesModule,
    StudentsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
