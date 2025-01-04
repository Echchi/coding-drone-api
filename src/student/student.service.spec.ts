import { StudentService } from './student.service';
import { LectureService } from '../lecture/lecture.service';
import { DeepPartial, InsertResult, Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lecture } from '../lecture/entities/lecture.entitiy';

describe('StudentsService', () => {
  let studentService: StudentService;
  let lectureService: LectureService;
  let studentRepository: Repository<Student>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: LectureService,
          useValue: {
            getOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Student),
          useClass: Repository,
        },
      ],
    }).compile();

    studentService = module.get<StudentService>(StudentService);
    lectureService = module.get<LectureService>(LectureService);
    studentRepository = module.get<Repository<Student>>(
      getRepositoryToken(Student),
    );
  });

  it('should be defined', () => {
    expect(studentService).toBeDefined();
    expect(lectureService).toBeDefined();
  });

  describe('lecture-connect', () => {
    it('should connect a student to a lecture', async () => {
      const body = { name: 'test', code: '00000' };

      const lecture: DeepPartial<Lecture> = {
        id: 1,
        code: '00000',
        active: true,
      };

      jest.spyOn(lectureService, 'getOne').mockResolvedValue(lecture);

      jest.spyOn(studentRepository, 'insert').mockResolvedValue({
        identifiers: [{ id: 1 }],
        generatedMaps: [],
        raw: [],
      } as InsertResult);

      const result = await studentService.connect(body);

      expect(lectureService.getOne).toHaveBeenCalledWith('00000');
      expect(studentRepository.insert).toHaveBeenCalledWith({
        name: 'test',
        lecture,
      });
      expect(result).toEqual({
        id: 1,
        name: 'test',
        lecture,
        joined_at: expect.any(Date),
      });
    });

    it('should throw an error if lecture is not found', async () => {
      const body = { name: 'test', code: 'invalid_code' };

      jest.spyOn(lectureService, 'getOne').mockResolvedValue(null);

      await expect(studentService.connect(body)).rejects.toThrow(
        'Lecture not found',
      );

      expect(lectureService.getOne).toHaveBeenCalledWith('invalid_code');
      expect(studentRepository.insert).not.toHaveBeenCalled();
    });
  });
});
