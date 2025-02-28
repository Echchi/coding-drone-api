import { StudentService } from './student.service';
import { LectureService } from '../lecture/lecture.service';
import { InsertResult, Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lecture } from '../lecture/entities/lecture.entitiy';
import { StudentConnectDto } from './dto/studnet.dto';
import { mockResponse } from '../test-utils/mockResponse';
import { JwtService } from '@nestjs/jwt';
import { mockJwtService } from '../test-utils/mockJwtService';
import { AuthService } from '../auth/auth.service';

describe('StudentsService', () => {
  let studentService: StudentService;
  let lectureService: LectureService;
  let jwtService: JwtService;
  let studentRepository: Repository<Student>;
  const mockAuthService = {
    studentLogin: jest
      .fn()
      .mockResolvedValue({ access_token: 'mockAccessToken' }),
  };
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
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(Student),
          useClass: Repository,
        },
      ],
    }).compile();

    studentService = module.get<StudentService>(StudentService);
    lectureService = module.get<LectureService>(LectureService);
    jwtService = module.get<JwtService>(JwtService);
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
      const connectDto: StudentConnectDto = { name: 'test', code: '00000' };

      const lecture = {
        id: 1,
        code: '00000',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
        instructor: { id: 1, userid: 'test' },
      } as Lecture;

      jest.spyOn(lectureService, 'getOne').mockResolvedValue(lecture);
      jest.spyOn(studentRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(studentRepository, 'save').mockResolvedValue({
        id: 1,
        name: 'test',
        lecture,
        joined_at: new Date(),
      } as Student);

      jest.spyOn(studentRepository, 'findOne').mockResolvedValueOnce(null);

      const res = mockResponse();

      const result = await studentService.connect(connectDto, res);

      expect(lectureService.getOne).toHaveBeenCalledWith('00000');
      expect(studentRepository.save).toHaveBeenCalledWith({
        name: 'test',
        lecture,
      });

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mockAccessToken');

      expect(result).toEqual({
        id: 1,
        name: 'test',
        lecture_id: 1,
        joined_at: expect.any(Date),
        access_token: 'mockAccessToken',
      });
    });
    it('should throw an error if the name is duplicated in the lecture', async () => {
      const connectDto: StudentConnectDto = { name: 'test', code: '00000' };

      const lecture = {
        id: 1,
        code: '00000',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
        instructor: { id: 1, userid: 'test' },
      } as Lecture;

      jest.spyOn(lectureService, 'getOne').mockResolvedValue(lecture);

      jest.spyOn(studentRepository, 'findOne').mockResolvedValue({
        id: 1,
        name: 'test',
        lecture,
      } as Student); // 중복 있음
      const res = mockResponse();

      await expect(studentService.connect(connectDto, res)).rejects.toThrow(
        'Name already exists in the lecture',
      );
    });
    it('should throw an error if lecture is not found', async () => {
      const connectDto: StudentConnectDto = {
        name: 'test',
        code: 'invalid_code',
      };

      jest.spyOn(lectureService, 'getOne').mockResolvedValue(null);
      jest
        .spyOn(studentRepository, 'insert')
        .mockResolvedValue({} as InsertResult);

      const res = mockResponse();

      await expect(studentService.connect(connectDto, res)).rejects.toThrow(
        'Lecture not found',
      );

      expect(studentRepository.insert).not.toHaveBeenCalled();
    });
  });
});
