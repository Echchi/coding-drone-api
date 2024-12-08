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

  async create(createDto: LectureCreateDto): Promise<{ code: string }> {
    const { instructorId, code } = createDto;
    const instructor = await this.instructorService.findOne(instructorId);
    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    await this.lectureRepository.insert({
      code,
      instructor,
      active: true,
    });
    return { code };
  }

  async update(updateDto: LectureUpdateDto): Promise<{ id: number }> {
    const { lectureId, active } = updateDto;

    const lecture = await this.lectureRepository.findOne({
      where: { id: lectureId },
    });
    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }
    await this.lectureRepository.update({ id: lecture.id }, { active });

    return { id: lectureId };
  }
}
