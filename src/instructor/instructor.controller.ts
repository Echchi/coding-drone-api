import {
  Controller,
  Get,
  Param,
  NotFoundException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { InstructorService } from './instructor.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
@ApiTags('Instructor')
@ApiBearerAuth('access-token')
@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  @ApiOperation({
    summary: '강사 조회',
    description: '강사 아이디를 통해 조회합니다.',
  })
  @ApiQuery({
    name: 'id',
    description: '강사 아이디',
    required: true,
    example: 'test',
  })
  async getOne(@Param('id') id: string) {
    const instructor = await this.instructorService.getOne(id);
    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }
    return instructor;
  }
}
