import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { InstructorService } from '../instructor/instructor.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { mockResponse } from '../test-utils/mockResponse';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  const mockInstructorService = {
    getOne: jest.fn().mockImplementation((userid: string) => {
      if (userid === 'tester') {
        return { id: 1, userid: 'tester', password: 'hashedPassword' };
      }
      return null;
    }),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mockAccessToken'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config = {
        JWT_EXPIRATION: '4h',
        JWT_REFRESH_EXPIRATION: '7d',
      };
      return config[key];
    }),
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
        {
          provide: ConfigService,
          useValue: mockConfigService,
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
      const res = mockResponse();

      const result = await service.logIn(loginDto, res);

      expect(mockInstructorService.getOne).toHaveBeenCalledWith('tester');
    });

    it('should throw an error if instructor is not found', async () => {
      mockInstructorService.getOne.mockResolvedValue(null);
      const loginDto = { userid: 'invalidUser', password: 'password' };
      const res = mockResponse();
      await expect(service.logIn(loginDto, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an error if the password is invalid', async () => {
      jest.spyOn(service as any, 'validatePassword').mockResolvedValue(false);
      const loginDto = { userid: 'tester', password: 'hashedPassword' };
      const res = mockResponse();
      await expect(service.logIn(loginDto, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return access_token if credentials are valid', async () => {
      mockInstructorService.getOne.mockResolvedValue({
        id: 1,
        userid: 'tester',
        password: 'hashedPassword',
      });
      jest.spyOn(service as any, 'validatePassword').mockResolvedValue(true);

      const loginDto = { userid: 'tester', password: 'hashedPassword' };
      const res = mockResponse();
      const result = await service.logIn(loginDto, res);

      expect(mockInstructorService.getOne).toHaveBeenCalledWith('tester');
      expect(result).toEqual({ access_token: 'mockAccessToken' });
    });
  });

  it('should set refresh token as a cookie', async () => {
    mockInstructorService.getOne.mockResolvedValue({
      id: 1,
      userid: 'tester',
      password: 'hashedPassword',
    });
    jest.spyOn(service as any, 'validatePassword').mockResolvedValue(true);

    const loginDto = { userid: 'tester', password: 'hashedPassword' };
    const res = mockResponse();

    await service.logIn(loginDto, res);

    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      }),
    );
  });

  it('should throw an error if refresh token is invalid', async () => {
    const invalidToken = 'invalidToken';
    jest.spyOn(mockJwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await expect(service.refreshAccessToken(invalidToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return new access token for a valid refresh token', async () => {
    const validToken = 'validRefreshToken';
    jest.spyOn(mockJwtService, 'verify').mockReturnValue({
      userid: 'tester',
      sub: 1,
    });

    const result = await service.refreshAccessToken(validToken);

    expect(result).toEqual('mockAccessToken');
  });
});
