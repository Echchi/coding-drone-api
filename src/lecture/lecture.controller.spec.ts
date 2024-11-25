import { Test, TestingModule } from '@nestjs/testing';
import { LectureController } from './lecture.controller';
import { LectureService } from './lecture.service';
import { LectureCreateDto, LectureUpdateDto } from './dto/lecture.dto';

describe('LectureController', () => {
  let controller: LectureController;

  const mockLectureService = {
    createLecture: jest.fn().mockResolvedValue('code123'),
    updateLecture: jest.fn(),
  };

  beforeEach(async () => {
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

      expect(mockLectureService.createLecture).toHaveBeenCalledWith(createDto);
      expect(result).toBe('00000');
    });
  });
  describe('update', () => {
    it('should deactivate a lecture by setting active to false', async () => {
      const updateDto: LectureUpdateDto = {
        lectureId: 1,
      };

      await controller.update(updateDto);
      expect(mockLectureService.updateLecture).toHaveBeenCalledWith(
        updateDto.lectureId,
        false,
      );
    });
    it('should throw an error if lecture does not exist', async () => {
      const updateDto: LectureUpdateDto = {
        lectureId: 9999,
      };

      mockLectureService.updateLecture.mockImplementation(() => {
        throw new Error('Lecture not found');
      });

      await expect(controller.update(updateDto)).rejects.toThrow(
        'Lecture not found',
      );
    });
  });
});
