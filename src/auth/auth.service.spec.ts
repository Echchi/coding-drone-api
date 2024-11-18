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
      const loginDto = { userid: 'tester', password: 'validPassword' };

      const result = await service.logIn(loginDto);

      expect(mockInstructorService.findOne).toHaveBeenCalledWith('tester');
      expect(result).toEqual({ access_token: 'mockAccessToken' });
    });

    it('should throw an error if instructor is not found', async () => {
      // 강사를 찾지 못한 경우를 테스트
      mockInstructorService.findOne.mockResolvedValue(null);
      const loginDto = { userid: 'invalidUser', password: 'password' };
      await expect(service.logIn(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an error if the password is invalid', () => {
      // 비밀번호가 틀린 경우를 테스트
      jest.spyOn(service as any, 'validPassword').mockResolvedValue(false);
    });

    it('should return access_token if credentials are valid', () => {
      // 올바른 자격 증명이 전달된 경우 access_token 반환 테스트
    });
  });

  describe('validatePassword', () => {
    it('should return true if passwords match', () => {
      // bcrypt.compare로 비밀번호가 일치하는 경우 테스트
    });

    it('should return false if passwords do not match', () => {
      // bcrypt.compare로 비밀번호가 일치하지 않는 경우 테스트
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token with the correct payload', () => {
      // 올바른 payload로 JWT 토큰 생성 테스트
    });
  });
});
