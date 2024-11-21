import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LectureService } from './lecture.service';
import { CreateDto, UpdateDto } from './dto/lecture.dto';

@ApiTags('Lecture')
@Controller('lecture')
export class LectureController {
  constructor(private lectureService: LectureService) {}

  @HttpCode(HttpStatus.OK)
  @Post('create')
  @ApiBody({ type: CreateDto, description: '강의 생성을 위한 api 입니다.' })
  create(@Body() createDto: CreateDto) {
    return this.lectureService.create(createDto);
  }
  @HttpCode(HttpStatus.OK)
  @Post('update')
  @ApiBody({
    type: UpdateDto,
    description: '강의 상태 변경을 위한 api 입니다.',
  })
  update(@Body() updateDto: UpdateDto) {
    return this.lectureService.update(updateDto);
  }
}
