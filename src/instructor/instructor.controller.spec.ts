import { Test, TestingModule } from '@nestjs/testing';
import { InstructorController } from './instructor.controller';
import { NotFoundException } from '@nestjs/common';
import { InstructorService } from './instructor.service';

describe('InstructorController', () => {
  let controller: InstructorController;
  let mockInstructorService;

  beforeEach(async () => {
    mockInstructorService = {
      getOne: jest.fn(),
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
  describe('getOne', () => {
    it('should find an instructor', async () => {
      const userid = 'test';
      const result = {
        id: 1,
        userid: 'tester',
      };
      mockInstructorService.getOne.mockResolvedValue(result);

      const response = await controller.getOne(userid);

      expect(mockInstructorService.getOne).toHaveBeenCalledWith(userid);
      expect(response).toEqual(result);
    });

    it('should throw an error if instructor is not found', async () => {
      const userid = 'tests';
      mockInstructorService.getOne.mockResolvedValue(null);

      await expect(controller.getOne(userid)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
