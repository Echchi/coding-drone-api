import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { InstructorService } from '../instructor/instructor.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockInstructorService: any;
  let mockJwtService: any;

  const mockInstructorService = {
    findOne: jest.fn(),
  };

  const mockJwtServie = {
    sign: jest.fn().mockReturnValue('mockAccessToken'),
  };

  const mockBcryt = {
    compare: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: InstructorService,
          useValue: mockInstructorService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    mockInstructorService.findOne.mockImplementation((userid) => {
      if (userid === 'tester') {
        return { id: 1, userid: 'tester', password: 'hashedPassword' };
      }
      return null;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
