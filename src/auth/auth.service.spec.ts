import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { InstructorService } from '../instructor/instructor.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockInstructorService = {
    findOne: jest.fn().mockImplementation((userid: string) => {
      if (userid === 'tester') {
        return { id: 1, userid: 'tester', password: 'hashedPassword' };
      }
      return null;
    }),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mockAccessToken'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: InstructorService,
          useValue: mockInstructorService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logIn', () => {
    it('should find the correct instructor when userid is valid', async () => {
      jest.spyOn(service as any, 'validatePassword').mockResolvedValue(true);
      const loginDto = { userid: 'tester', password: 'hashedPassword' };

      const result = await service.logIn(loginDto);

      expect(mockInstructorService.findOne).toHaveBeenCalledWith('tester');
    });

    it('should throw an error if instructor is not found', async () => {
      mockInstructorService.findOne.mockResolvedValue(null);
      const loginDto = { userid: 'invalidUser', password: 'password' };
      await expect(service.logIn(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an error if the password is invalid', async () => {
      jest.spyOn(service as any, 'validatePassword').mockResolvedValue(false);
      const loginDto = { userid: 'tester', password: 'hashedPassword' };
      await expect(service.logIn(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return access_token if credentials are valid', async () => {
      mockInstructorService.findOne.mockResolvedValue({
        id: 1,
        userid: 'tester',
        password: 'hashedPassword',
      });
      jest.spyOn(service as any, 'validatePassword').mockResolvedValue(true);

      const loginDto = { userid: 'tester', password: 'hashedPassword' };

      const result = await service.logIn(loginDto);

      expect(mockInstructorService.findOne).toHaveBeenCalledWith('tester');
      expect(result).toEqual({ access_token: 'mockAccessToken' });
    });
  });
});
