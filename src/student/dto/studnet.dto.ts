import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StudentConnectDto {
  @ApiProperty({
    description: '학생 이름',
    example: 'test',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '접속 코드',
    example: '00000',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
