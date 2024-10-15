import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instructor } from './instructor/instructor.entity';
import { Lectures } from './lectures/lectures.entity';
import { Students } from './students/students.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: '3052',
      database: 'coding_drone',
      entities: [Instructor, Lectures, Students],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
