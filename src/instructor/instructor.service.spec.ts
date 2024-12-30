import { Test, TestingModule } from '@nestjs/testing';
import { InstructorService } from './instructor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Instructor } from './entities/instructor.entity';
import { Repository } from 'typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
describe('InstructorService', () => {
  let service: InstructorService;

  const mockInstructorRepository: MockRepository<Instructor> = {
    findOne: jest.fn().mockImplementation((query) => {
      if (query.where.userid === 'tester') {
        return Promise.resolve({
          id: 1,
          userid: 'tester',
          password: 'hashedPassword',
        });
      }
      return Promise.resolve(undefined);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstructorService,
        {
          provide: getRepositoryToken(Instructor),
          useValue: mockInstructorRepository,
        },
      ],
    }).compile();

    service = module.get<InstructorService>(InstructorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOne', () => {
    it('should return an Instructor when a valid userid is provided', async () => {
      const user = await service.getOne('tester');
      expect(user).toBeDefined();
    });

    it('should return an error if the user does not exist', async () => {
      await expect(service.getOne('testers')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOne('testers')).rejects.toThrow(
        'Instructor not found',
      );
    });
  });
});
