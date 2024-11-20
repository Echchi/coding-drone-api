import { Test, TestingModule } from '@nestjs/testing';
import { LectureController } from './lecture.controller';
import { LectureService } from './lecture.service';

describe('LectureController', () => {
  let controller: LectureController;

  const mockLecturesService = {
    createLecture: jest.fn().mockResolvedValue('code123'),
    updateLecture: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LectureController],
      providers: [
        {
          provide: LectureService,
          useValue: mockLecturesService,
        },
      ],
    }).compile();

    controller = module.get<LectureController>(LectureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('createLecture', () => {
    it('should generate a unique lecture code and create a lecture with active status', async () => {
      const instructorId = 1;
      const result = await controller.createLecture({ instructorId });

      expect(mockLectureService.createLecture).toHaveBeenCalledWith(
        instructorId,
      );
      expect(result).toBe('code123');
    });
  });
  describe('updateLecture', () => {
    it('should deactivate a lecture by setting active to false', async () => {
      const lectureId = 1;
      await controller.updateLecture(lectureId);
      expect(mockLecturesService.updateLecture).toHaveBeenCalledWith(
        lectureId,
        false,
      );
    });
    it('should throw an error if lecture does not exist', async () => {
      const lectureId = 99;
      mockLecturesService.updateLecture.mockImplementation(() => {
        throw new Error('Lecture not found');
      });

      await expect(controller.updateLecture(lectureId)).rejects.toThrow(
        'Lecture not found',
      );
    });
  });
});
