import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { StudentConnectDto } from './dto/studnet.dto';

@ApiTags('Student')
@ApiBearerAuth('access-token')
@Controller()
export class StudentController {
  constructor(private studentService: StudentService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/lecture-connect')
  @ApiOperation({
    summary: '강의 접속',
    description:
      '학생을 특정 강의에 연결합니다. \n' +
      '요청 시 학생 이름(name)과 강의 코드(code)를 입력해야 하며, 응답으로 연결된 학생 정보와 강의 ID, 접속 시간(joined_at)을 반환합니다',
  })
  @ApiBody({
    type: StudentConnectDto,
    description: '강의 연결에 필요한 데이터를 입력합니다.',
  })
  connect(@Body() connectDto: StudentConnectDto) {
    return this.studentService.connect(connectDto);
  }
}
