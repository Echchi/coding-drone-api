import { Test, TestingModule } from '@nestjs/testing';
import { InstructorController } from './instructor.controller';
import { NotFoundException } from '@nestjs/common';
import { InstructorService } from './instructor.service';

describe('InstructorController', () => {
  let controller: InstructorController;
  let mockInstructorService;

  beforeEach(async () => {
    mockInstructorService = {
      findOne: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstructorController],
      providers: [
        {
          provide: InstructorService,
          useValue: mockInstructorService,
        },
      ],
    }).compile();

    controller = module.get<InstructorController>(InstructorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('findOne', () => {
    it('should find an instructor', async () => {
      const userid = 'test';
      mockInstructorService.findOne.mockResolvedValue(result);

      const response = await controller.findOne(userid);

      expect(mockInstructorService.findOne).toHaveBeenCalledWith(userid);
      expect(response).toEqual(result);
    });

    it('should throw an error if instructor is not found', async () => {
      const userid = 'tests';
      mockInstructorService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(userid)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
