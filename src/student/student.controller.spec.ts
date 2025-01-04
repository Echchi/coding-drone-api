import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentConnectDto } from './dto/studnet.dto';
import { Lecture } from '../lecture/entities/lecture.entitiy';
import { StudentService } from './student.service';
import { NotFoundException } from '@nestjs/common';
import mock = jest.mock;

describe('StudentsController', () => {
  let controller: StudentController;
  let mockStudentService;

  const lecture = {
    id: 1,
    code: '00000',
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    instructor: { id: 1, userid: 'test' },
  } as Lecture;
  beforeEach(async () => {
    mockStudentService = {
      connect: jest.fn().mockResolvedValue({
        id: 1,
        name: 'test',
        lecture,
        joined_at: expect.any(Date),
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        {
          provide: StudentService,
          useValue: mockStudentService,
        },
      ],
    }).compile();

    controller = module.get<StudentController>(StudentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('lecture-connect', () => {
    it('should connect a student to a lecture', async () => {
      const connectDto: StudentConnectDto = { name: 'test', code: '00000' };

      const result = await controller.connect(connectDto);

      expect(mockStudentService.connect).toHaveBeenCalledWith(connectDto);
      expect(result).toBe(lecture);
    });

    it('should throw an error if lecture is not found', async () => {
      const connectDto: StudentConnectDto = {
        name: 'test',
        code: 'invalid_code',
      };

      mockStudentService.connect.mockRejectedValue(() => {
        throw new NotFoundException('Lecture not found');
      });

      await expect(controller.connect(connectDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
