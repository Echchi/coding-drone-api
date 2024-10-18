import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';  // 추가
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instructor } from './instructor/instructor.entity';
import { Lectures } from './lectures/lectures.entity';
import { Students } from './students/students.entity';
import { InstructorModule } from './instructor/instructor.module';
import { LecturesModule } from './lectures/lectures.module';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';

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
})
export class AppModule {}
