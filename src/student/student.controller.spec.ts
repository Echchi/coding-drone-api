import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentConnectDto } from './dto/studnet.dto';
import { Lecture } from '../lecture/entities/lecture.entitiy';
import { StudentService } from './student.service';
import { NotFoundException } from '@nestjs/common';
import { mockResponse } from '../test-utils/mockResponse';

describe('StudentsController', () => {
  let controller: StudentController;
  let mockStudentService;

  beforeEach(async () => {
    mockStudentService = {
      connect: jest.fn().mockResolvedValue({
        id: 1,
        name: 'test',
        lecture_id: 1,
        joined_at: expect.any(Date),
        access_token: 'mockAccessToken',
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
      const res = mockResponse();

      const result = await controller.connect(connectDto, res);

      expect(mockStudentService.connect).toHaveBeenCalledWith(connectDto, res);
      expect(result).toEqual({
        id: 1,
        name: 'test',
        lecture_id: 1,
        joined_at: expect.any(Date),
        access_token: 'mockAccessToken',
      });
    });

    it('should throw an error if lecture is not found', async () => {
      const connectDto: StudentConnectDto = {
        name: 'test',
        code: 'invalid_code',
      };

      mockStudentService.connect.mockRejectedValue(() => {
        throw new NotFoundException('Lecture not found');
      });
      const res = mockResponse();

      await expect(controller.connect(connectDto, res)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
