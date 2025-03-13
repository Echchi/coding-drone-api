import { Injectable, NotFoundException } from '@nestjs/common';
import { InstructorService } from '../instructor/instructor.service';
import { LectureUpdateDto } from './dto/lecture.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Lecture } from './entities/lecture.entitiy';
import { Repository } from 'typeorm';
import { LectureCreateDto } from './dto/lecture.dto';
import { InstructorGateway } from 'src/websocket/instructor.gateway';

@Injectable()
export class LectureService {
  constructor(
    @InjectRepository(Lecture)
    private lectureRepository: Repository<Lecture>,
    private instructorService: InstructorService,
    private instructorGateway: InstructorGateway,
  ) {}

  generateCode(): { code: string } {
    const min = 10000;
    const max = 99999;
    const code = Math.floor(Math.random() * (max - min + 1) + min).toString();
    return { code };
  }

  async create(createLectureDto: LectureCreateDto) {
    const { instructorId } = createLectureDto;

    // 강사 존재 여부 확인
    const instructor = await this.instructorService.getOne(instructorId);
    if (!instructor) {
      throw new Error('강사를 찾을 수 없습니다.');
    }

    // 강의 생성
    const lecture = await this.lectureRepository.save({
      code: createLectureDto.code,
      instructorId: instructor.id,
      active: true,
    });

    // 소켓 room 준비
    const instructorRoom = this.instructorGateway.getInstructorRoom(
      lecture.code,
    );

    return {
      ...lecture,
      instructorRoom,
    };
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

    // 강의가 비활성화되는 경우 (강의 종료)
    if (lecture.active && !active) {
      // 소켓 연결 정리
      await this.instructorGateway.endLecture(lecture.code);
    }

    lecture.active = active;
    const updatedLecture = await this.lectureRepository.save(lecture);

    return {
      id: updatedLecture.id,
      active: updatedLecture.active,
    };
  }

  async getOne(code: string): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({
      where: { code },
    });

    if (!lecture) {
      throw new Error('강의를 찾을 수 없습니다.');
    }

    return lecture;
  }
}
