import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { LectureService } from '../lecture/lecture.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  StudentConnectDto,
  StudentConnectResponseDto,
} from './dto/studnet.dto';
import { Lecture } from '../lecture/entities/lecture.entitiy';
import { AuthService } from '../auth/auth.service';
import { Response } from 'express';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private lectureService: LectureService,
    private authService: AuthService,
  ) {}

  private async validateLecture(code: string): Promise<Lecture> {
    const lecture = await this.lectureService.getOne(code);
    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }
    return lecture;
  }

  private async checkName(name: string, lectureId: number): Promise<boolean> {
    const existingStudent = await this.studentRepository.findOne({
      where: { name, lecture: { id: lectureId } },
    });

    return !existingStudent;
  }
  async connect(
    connectDto: StudentConnectDto,
    res: Response,
  ): Promise<StudentConnectResponseDto & { access_token: string }> {
    const { name, code } = connectDto;
    const lecture = await this.validateLecture(code);
    if (!lecture) {
      throw new NotFoundException('Lecture not exists');
    }
    const isNameUnique = await this.checkName(name, lecture.id);
    if (!isNameUnique) {
      throw new BadRequestException('Name already exists in the lecture');
    }
    const insertedStudent = await this.studentRepository.save({
      name,
      lecture,
    });

    if (!insertedStudent) {
      throw new NotFoundException('Failed to create student');
    }

    const token = await this.authService.studentLogin(
      { id: insertedStudent.id, lecture_id: lecture.id },
      res,
    );

    if (insertedStudent) {
      return {
        id: insertedStudent.id,
        name: insertedStudent.name,
        lecture_id: insertedStudent.lecture.id,
        joined_at: insertedStudent.joined_at,
        access_token: token.access_token,
      };
    }
  }
}
