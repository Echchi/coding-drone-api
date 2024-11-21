import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDto {
  @ApiProperty({
    description: '강사 아이디',
    example: 'test',
  })
  @IsString()
  instructorId: string;
}
export class UpdateDto {
  @ApiProperty({
    description: '강의 아이디',
    example: 1,
  })
  @IsNumber()
  lectureId: number;

  @ApiProperty({
    description: '강의 활성화 여부',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: true;
}
