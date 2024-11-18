import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    logIn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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

      const result = await controller.logIn(loginDto);

      expect(mockAuthService.logIn).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({ accessToken: 'mockAccessToken' });
    });

    it('should throw UnauthorizedException on valid credentials', async () => {
      const loginDto: LoginDto = {
        userid: 'invalidUser',
        password: 'wrongPassword',
      };

      mockAuthService.logIn.mockRejectedValueOnce(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.logIn(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
