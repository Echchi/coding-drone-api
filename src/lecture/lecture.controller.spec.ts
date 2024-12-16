import { Test, TestingModule } from '@nestjs/testing';

import { LectureCreateDto, LectureUpdateDto } from './dto/lecture.dto';
import { NotFoundException } from '@nestjs/common';
import { LectureController } from './lecture.controller';
import { LectureService } from './lecture.service';

describe('LectureController', () => {
  let controller: LectureController;
  let mockLectureService;

  beforeEach(async () => {
    mockLectureService = {
      create: jest.fn().mockResolvedValue('00000'),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      getOne: jest.fn().mockResolvedValue({
        instructorId: 'test',
        code: '00000',
        lectureId: 1,
        active: true,
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LectureController],
      providers: [
        {
          provide: LectureService,
          useValue: mockLectureService,
        },
      ],
    }).compile();

    controller = module.get<LectureController>(LectureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('create', () => {
    it('should generate a unique lecture code and create a lecture with active status', async () => {
      const createDto: LectureCreateDto = {
        instructorId: 'test',
        code: '00000',
      };
      const result = await controller.create(createDto);

      expect(mockLectureService.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe('00000');
    });
  });
  describe('update', () => {
    it('should deactivate a lecture by setting active to false', async () => {
      const updateDto: LectureUpdateDto = {
        lectureId: 1,
        active: false,
      };

      const result = await controller.update(updateDto);

      expect(mockLectureService.update).toHaveBeenCalledWith(updateDto);

      expect(result).toEqual({ id: 1 });
    });
    it('should throw an error if lecture does not exist', async () => {
      const updateDto: LectureUpdateDto = {
        lectureId: 9999,
        active: false,
      };

      mockLectureService.update.mockRejectedValue(() => {
        throw new NotFoundException('Lecture not found');
      });

      await expect(controller.update(updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('getOne', () => {
    it('should find a lecture', async () => {
      const code = '00000';
      const result = {
        instructorId: 'test',
        code: '00000',
        lectureId: 1,
        active: true,
      };
      const response = await controller.getOne(code);

      expect(mockLectureService.getOne).toHaveBeenCalledWith(code);
      expect(response).toEqual(result);
    });
    it('should throw an error if lecture is not found', async () => {
      const code = '00000';

      mockLectureService.getOne.mockRejectedValue(() => {
        throw new NotFoundException('Lecture not found');
      });

      await expect(controller.getOne(code)).rejects.toThrow(NotFoundException);
      await expect(controller.getOne(code)).rejects.toThrow(
        'Lecture not found',
      );
    });
  });
});
