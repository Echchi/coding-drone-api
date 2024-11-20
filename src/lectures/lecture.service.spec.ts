import { Test, TestingModule } from '@nestjs/testing';
import { LectureService } from './lecture.service';
import { Repository } from 'typeorm';
import { Lecture } from './entities/lectures.entitiy';
import { Instructor } from '../instructor/entities/instructor.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

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
  describe('createLecture', () => {
    it('should generate a unique lecture code and create a lecture with active status', async () => {
      const instructorId = 1;
      const instructor = new Instructor();
      instructor.id = instructorId;

      const code = 'mockedCode123';

      jest.spyOn(instructorRepository, 'findOne').mockResolvedValue(instructor);

      const mockInsert = jest
        .spyOn(lectureRepository, 'insert')
        .mockImplementation(async (lecture) => ({
          generatedMaps: [],
          raw: [],
          affected: 1,
        }));

      expect(mockInsert).toHaveBeenCalledWith({
        code,
        instructor,
        active: true,
      });
    });
    it('should throw an error if instructor is not found', async () => {
      const instructorId = 99;
      jest.spyOn(instructorRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createLecture(instructorId)).rejects.toThrowError(
        'Instructor not found',
      );
    });
  });
  describe('updateActive', () => {
    it('should deactivate a lecture by setting active to false', async () => {
      const lectureId = 1;
      const lecture = new Lecture();
      lecture.id = lectureId;
      lecture.active = true;

      jest.spyOn(lectureRepository, 'findOne').mockResolvedValue(lecture);
      const mockUpdate = jest
        .spyOn(lectureRepository, 'update')
        .mockResolvedValue({
          generatedMaps: [],
          raw: [],
          affected: 1,
        });

      await service.updateActive(lectureId, false);

      expect(mockUpdate).toHaveBeenCalledWith(lectureId, { active: false });
    });

    it('should throw an error if lecture does not exist', async () => {
      const lectureId = 99;
      jest.spyOn(lectureRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateActive(lectureId, false)).rejects.toThrowError(
        'Lecture not found',
      );
    });
  });
});
