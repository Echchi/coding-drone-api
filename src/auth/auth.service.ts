import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InstructorService } from '../instructor/instructor.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { StudentConnectResponseDto } from '../student/dto/studnet.dto';

@Injectable()
export class AuthService {
  constructor(
    private instructorService: InstructorService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async logIn(
    loginDto: LoginDto,
    res: Response,
  ): Promise<{ instructorId: string; access_token: string }> {
    const { userid, password } = loginDto;

    const instructor = await this.instructorService.getOne(userid);

    if (
      !instructor ||
      !(await this.validatePassword(password, instructor.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userid: instructor.userid, sub: instructor.id };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { instructorId: instructor.userid, access_token: accessToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      return this.generateAccessToken(payload);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async validatePassword(
    inputPassword: string,
    savedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(inputPassword, savedPassword);
  }

  private generateAccessToken(payload: Record<string, any>): string {
    const expiresIn = this.configService.get<string>('JWT_EXPIRATION');
    return this.jwtService.sign(payload, { expiresIn });
  }

  private generateRefreshToken(payload: Record<string, any>): string {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    return this.jwtService.sign(payload, { expiresIn });
  }

  async studentLogin(
    studentConnectDto: Pick<StudentConnectResponseDto, 'id' | 'lecture_id'>,
    res: Response,
  ): Promise<{ access_token: string }> {
    const { id, lecture_id } = studentConnectDto;

    const payload = { studentId: id, lectureId: lecture_id };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: accessToken };
  }
}
