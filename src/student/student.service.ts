import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { LectureService } from '../lecture/lecture.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  StudentConnectDto,
  StudentConnectResponseDto,
} from './dto/studnet.dto';
import { Lecture } from '../lecture/entities/lecture.entitiy';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private lectureService: LectureService,
  ) {}

  private async validateLecture(code: string): Promise<Lecture> {
    const lecture = await this.lectureService.getOne(code);
    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }
    return lecture;
  }
  async connect(
    connectDto: StudentConnectDto,
  ): Promise<StudentConnectResponseDto> {
    const { name, code } = connectDto;
    const lecture = await this.validateLecture(code);
    const insertResult = await this.studentRepository.insert({
      name,
      lecture,
    });

    const studentId = insertResult.identifiers[0]?.id;
    const insertedStudent = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['lecture'],
    });

    if (insertedStudent) {
      return {
        id: studentId,
        name: insertedStudent.name,
        lecture_id: insertedStudent.lecture.id,
        joined_at: insertedStudent.joined_at,
      };
    }
  }
}
