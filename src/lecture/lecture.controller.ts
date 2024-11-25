import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LectureService } from './lecture.service';
import { LectureCreateDto } from './dto/lecture.dto';

@ApiTags('Lecture')
@Controller('lecture')
export class LectureController {
  constructor(private lectureService: LectureService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/generate-code')
  @ApiBody({
    description: '강의 코드 생성을 위한 api',
  })
  generateCode() {
    return this.lectureService.generateCode();
  }

  @HttpCode(HttpStatus.OK)
  @Post()
  @ApiBody({
    type: LectureCreateDto,
    description: '강의 생성을 위한 api',
  })
  create(@Body() createDto: LectureCreateDto) {
    return this.lectureService.create(createDto);
  }
  // @HttpCode(HttpStatus.OK)
  // @Post('update')
  // @ApiBody({
  //   type: UpdateDto,
  //   description: '강의 상태 변경을 위한 api',
  // })
  // update(@Body() updateDto: UpdateDto) {
  //   return this.lectureService.update(updateDto);
  // }
}
