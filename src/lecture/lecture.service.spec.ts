import { Test, TestingModule } from '@nestjs/testing';
import { LectureService } from './lecture.service';
import { Repository } from 'typeorm';
import { Lecture } from './entities/lecture.entitiy';
import { Instructor } from '../instructor/entities/instructor.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LectureCreateDto, LectureUpdateDto } from './dto/lecture.dto';
import { InstructorService } from '../instructor/instructor.service';
import { NotFoundException } from '@nestjs/common';

describe('LectureService', () => {
  let service: LectureService;
  let lectureRepository: Repository<Lecture>;
  let mockInstructorService;

  beforeEach(async () => {
    mockInstructorService = {
      getOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureService,
        {
          provide: getRepositoryToken(Lecture),
          useValue: {
            findOne: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            getOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Instructor),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: InstructorService,
          useValue: mockInstructorService,
        },
      ],
    }).compile();

    service = module.get<LectureService>(LectureService);
    lectureRepository = module.get<Repository<Lecture>>(
      getRepositoryToken(Lecture),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('create', () => {
    it('should generate a unique lecture code and create a lecture with active status', async () => {
      const instructor = { id: 1 };
      const createDto: LectureCreateDto = {
        instructorId: 'test',
        code: '00000',
      };

      mockInstructorService.getOne.mockResolvedValue(instructor);

      const mockInsert = jest
        .spyOn(lectureRepository, 'insert')
        .mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(mockInsert).toHaveBeenCalledWith({
        code: createDto.code,
        instructor,
        active: true,
      });
    });
    it('should throw an error if instructor is not found', async () => {
      const createDto: LectureCreateDto = {
        instructorId: 'tests',
        code: '00000',
      };
      mockInstructorService.getOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrowError(
        'Instructor not found',
      );
    });
  });
  describe('update', () => {
    it('should deactivate a lecture by setting active to false', async () => {
      const updateDto: LectureUpdateDto = {
        lectureId: 1,
        active: false,
      };
      const lecture = new Lecture();
      lecture.id = 1;
      jest.spyOn(lectureRepository, 'findOne').mockResolvedValue(lecture);
      const mockUpdate = jest
        .spyOn(lectureRepository, 'update')
        .mockResolvedValue({
          generatedMaps: [],
          raw: [],
          affected: 1,
        });

      await service.update(updateDto);

      expect(mockUpdate).toHaveBeenCalledWith(
        { id: updateDto.lectureId },
        { active: updateDto.active },
      );
    });

    it('should throw an error if lecture does not exist', async () => {
      const updateDto: LectureUpdateDto = {
        lectureId: 1,
      };
      jest.spyOn(lectureRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(updateDto)).rejects.toThrowError(
        'Lecture not found',
      );
    });
  });
  describe('getOne', () => {
    it('should return an lecture when a valid code is provided', async () => {
      const lecture = {
        id: 1,
        code: '00000',
        active: true,
      };

      jest.spyOn(lectureRepository, 'findOne').mockResolvedValue(lecture);

      const result = await service.getOne('00000');

      expect(lectureRepository.findOne).toHaveBeenCalledWith({
        where: { code: '00000', active: true },
      });
      expect(result).toEqual(lecture);
    });

    it('should return an error if the lecture does not exist', async () => {
      await expect(service.getOne('12345')).rejects.toThrow(NotFoundException);
      await expect(service.getOne('12345')).rejects.toThrow(
        'Lecture not found',
      );
    });
  });
});
