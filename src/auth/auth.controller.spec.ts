import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { mockResponse } from '../test-utils/mockResponse';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    logIn: jest.fn(),
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call AuthService.logIn with correct parameters', async () => {
      const loginDto: LoginDto = {
        userid: 'tester',
        password: 'password',
      };

      mockAuthService.logIn.mockResolvedValueOnce({
        accessToken: 'mockAccessToken',
      });
      const res = mockResponse();

      const result = await controller.logIn(loginDto, res);

      expect(mockAuthService.logIn).toHaveBeenCalledWith(loginDto, res);
      expect(result).toEqual({ accessToken: 'mockAccessToken' });
    });

    it('should throw UnauthorizedException on invalid credentials\n', async () => {
      const loginDto: LoginDto = {
        userid: 'invalidUser',
        password: 'wrongPassword',
      };

      mockAuthService.logIn.mockRejectedValueOnce(
        new UnauthorizedException('Invalid credentials'),
      );

      const res = mockResponse();
      await expect(controller.logIn(loginDto, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
