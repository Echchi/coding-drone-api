import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @SetMetadata('isPublic', true)
  @ApiBody({ type: LoginDto, description: '강사 로그인을 위한 api' })
  logIn(@Body() logInDto: LoginDto) {
    return this.authService.logIn(logInDto);
  }
}
