import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LectureService } from './lecture.service';
import { LectureCreateDto, LectureUpdateDto } from './dto/lecture.dto';

@ApiTags('Lecture')
@ApiBearerAuth('access-token')
@Controller('lecture')
export class LectureController {
  constructor(private lectureService: LectureService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/generate_code')
  @ApiOperation({
    summary: '강의 코드 생성',
    description: '랜덤한 강의 코드를 생성하여 반환합니다.',
  })
  generateCode() {
    return this.lectureService.generateCode();
  }

  @HttpCode(HttpStatus.OK)
  @Post()
  @ApiOperation({
    summary: '강의 생성',
    description: '강의를 생성하고 활성화된 상태로 저장합니다.',
  })
  @ApiBody({
    type: LectureCreateDto,
    description:
      '강의 생성에 필요한 데이터 (강사 ID와 강의 코드)를 입력합니다.',
  })
  create(@Body() createDto: LectureCreateDto) {
    return this.lectureService.create(createDto);
  }
  @HttpCode(HttpStatus.OK)
  @Put()
  @ApiOperation({
    summary: '강의 상태 업데이트',
    description:
      '강의의 상태를 업데이트합니다. 강의를 비활성화하는 등의 작업을 수행할 수 있습니다.',
  })
  @ApiBody({
    type: LectureUpdateDto,
    description:
      '강의 상태 업데이트에 필요한 데이터 (강의 ID와 상태)를 입력합니다.',
  })
  update(@Body() updateDto: LectureUpdateDto) {
    return this.lectureService.update(updateDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  @SetMetadata('isPublic', true)
  @ApiOperation({
    summary: '강의 조회',
    description:
      '학생이 강의에 입장하기 위해 입력한 접속 코드로 활성화된 강의 정보를 조회합니다. 강의가 비활성화된 경우 조회되지 않습니다.',
  })
  @ApiQuery({
    name: 'code',
    description: '강의 접속 코드',
    required: true,
    example: '00000',
  })
  getOne(@Query('code') code: string) {
    return this.lectureService.getOne(code);
  }
}
