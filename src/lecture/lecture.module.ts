import { Module } from '@nestjs/common';
import { LectureService } from './lecture.service';
import { LectureController } from './lecture.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lecture } from './entities/lecture.entitiy';
import { InstructorModule } from '../instructor/instructor.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lecture]), InstructorModule],
  providers: [LectureService],
  controllers: [LectureController],
  exports: [LectureService],
})
export class LectureModule {}
