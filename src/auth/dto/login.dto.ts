import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '강사 아이디',
    example: 'test',
  })
  @IsString()
  userid: string;

  @ApiProperty({
    description: '강사 비밀번호',
    example: 'password',
  })
  @IsString()
  password: string;
}
