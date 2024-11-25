import { Test, TestingModule } from '@nestjs/testing';
import { LectureService } from './lecture.service';
import { Repository } from 'typeorm';
import { Lecture } from './entities/lecture.entitiy';
import { Instructor } from '../instructor/entities/instructor.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LectureCreateDto, LectureUpdateDto } from './dto/lecture.dto';

describe('LectureService', () => {
  let service: LectureService;
  let lectureRepository: Repository<Lecture>;
  let instructorRepository: Repository<Instructor>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureService,
        {
          provide: getRepositoryToken(Lecture),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Instructor),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<LectureService>(LectureService);
    lectureRepository = module.get<Repository<Lecture>>(
      getRepositoryToken(Lecture),
    );
    instructorRepository = module.get<Repository<Instructor>>(
      getRepositoryToken(Instructor),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('create', () => {
    it('should generate a unique lecture code and create a lecture with active status', async () => {
      const instructor = new Instructor();
      const createDto: LectureCreateDto = {
        instructorId: 'test',
        code: '00000',
      };

      jest.spyOn(instructorRepository, 'findOne').mockResolvedValue(instructor);

      const mockInsert = jest
        .spyOn(lectureRepository, 'insert')
        .mockImplementation(async (lecture) => ({
          identifiers: [{ id: 1 }],
          generatedMaps: [],
          raw: [],
          affected: 1,
        }));
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
      jest.spyOn(instructorRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrowError(
        'Instructor not found',
      );
    });
  });
  describe('update', () => {
    it('should deactivate a lecture by setting active to false', async () => {
      const updateDto: LectureUpdateDto = {
        lectureId: 1,
      };
      const lecture = new Lecture();

      jest.spyOn(lectureRepository, 'findOne').mockResolvedValue(lecture);
      const mockUpdate = jest
        .spyOn(lectureRepository, 'update')
        .mockResolvedValue({
          generatedMaps: [],
          raw: [],
          affected: 1,
        });

      await service.update(updateDto);

      expect(mockUpdate).toHaveBeenCalledWith(updateDto);
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
});
