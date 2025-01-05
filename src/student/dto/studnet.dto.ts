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

export class StudentConnectResponseDto {
  @ApiProperty({
    description: '학생 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '학생 이름',
    example: 'test',
  })
  name: string;

  @ApiProperty({
    description: '강의 ID',
    example: 1,
  })
  lecture_id: number;

  @ApiProperty({
    description: '접속 시간',
    example: '2024-12-30T15:30:00.000Z',
  })
  joined_at: Date;
}
