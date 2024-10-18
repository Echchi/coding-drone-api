import { InstructorService } from '../instructor/instructor.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from "@nestjs/common";

export class AuthService {
  constructor(
    private instructorService: InstructorService,
    private jwtService: JwtService,
  ) {}
  async signIn(username: string, password: string):Promise<{access_token : string}>{
    const instructor = await this.instructorService.findOne(username);
    if (
      !instructor ||
      !(await this.validatePassword(password, instructor.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
  const payload = {username : instructor.username , sub: instructor.id};
    return {
    access_token : this.jwtService.sign(payload),
  };
  }


  private async validatePassword(inputPassword: string, savedPassword: any): Promise<boolean> {
    return inputPassword === savedPassword;
  }
}
