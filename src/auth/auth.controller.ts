import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  SetMetadata,
  UnauthorizedException,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @SetMetadata('isPublic', true)
  @ApiOperation({
    summary: '로그인 API',
    description: '강사 로그인을 위한 API',
  })
  @ApiBody({ type: LoginDto, description: '로그인 데이터 (ID와 비밀번호)' })
  logIn(@Body() logInDto: LoginDto, @Res() res: Response) {
    return this.authService.logIn(logInDto, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  @ApiOperation({
    summary: '리프레시 토큰을 통한 액세스 토큰 갱신',
    description:
      '쿠키에 저장된 리프레시 토큰을 사용하여 새 액세스 토큰을 발급받습니다.',
  })
  async refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const newAccessToken =
      await this.authService.refreshAccessToken(refreshToken);
    return { access_token: newAccessToken };
  }
}
