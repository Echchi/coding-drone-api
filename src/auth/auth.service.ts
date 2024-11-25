import { InstructorService } from '../instructor/instructor.service';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private instructorService: InstructorService,
    private jwtService: JwtService,
  ) {}

  async logIn(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { userid, password } = loginDto;
    const instructor = await this.instructorService.findOne(userid);
    if (
      !instructor ||
      !(await this.validatePassword(password, instructor.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { userid: instructor.userid, sub: instructor.id };

    const token = await this.generateToken(payload);

    return { access_token: token };
  }

  private async validatePassword(
    inputPassword: string,
    savedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(inputPassword, savedPassword);
  }

  private async generateToken(payload: { userid: string; sub: number }) {
    return this.jwtService.sign(payload);
  }
}
