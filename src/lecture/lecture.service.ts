import { Injectable, NotFoundException } from '@nestjs/common';
import { InstructorService } from '../instructor/instructor.service';
import { LectureCreateDto, LectureUpdateDto } from './dto/lecture.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Lecture } from './entities/lecture.entitiy';
import { Repository } from 'typeorm';

@Injectable()
export class LectureService {
  constructor(
    @InjectRepository(Lecture)
    private lectureRepository: Repository<Lecture>,
    private instructorService: InstructorService,
  ) {}

  generateCode(): { code: string } {
    const min = 10000;
    const max = 99999;
    const code = Math.floor(Math.random() * (max - min + 1) + min).toString();
    return { code };
  }

  async create(
    createDto: LectureCreateDto,
  ): Promise<{ lectureId: number; code: string }> {
    const { instructorId, code } = createDto;
    const instructor = await this.instructorService.getOne(instructorId);
    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const insertResult = await this.lectureRepository.insert({
      code,
      instructor,
      active: true,
    });

    const lectureId = insertResult.identifiers[0]?.id;
    const result = await this.lectureRepository.findOne({
      where: { id: lectureId },
    });
    if (result) {
      return { lectureId, code: result.code };
    }
  }

  async update(
    updateDto: LectureUpdateDto,
  ): Promise<{ id: number; active: boolean }> {
    const { lectureId, active } = updateDto;

    const lecture = await this.lectureRepository.findOne({
      where: { id: lectureId },
    });
    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    lecture.active = active;

    const updatedLecture = await this.lectureRepository.save(lecture);

    return { id: updatedLecture.id, active: updatedLecture.active };
  }

  async getOne(code: string): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({
      where: { code, active: true },
    });
    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    return lecture;
  }
}
