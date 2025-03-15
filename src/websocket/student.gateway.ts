import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { InstructorGateway } from './instructor.gateway';

@Injectable()
@WebSocketGateway({
  namespace: 'student',
  cors: { origin: '*' },
})
export class StudentGateway {
  private readonly logger = new Logger(StudentGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly instructorGateway: InstructorGateway,
  ) {}

  @WebSocketServer()
  server: Server;

  private getLectureRoom(lectureCode: string): string {
    return `lecture:${lectureCode}`;
  }

  private getStudentsRoom(lectureCode: string): string {
    return `lecture:${lectureCode}:students`;
  }

  @SubscribeMessage('joinLecture')
  async handleJoinLecture(
    @MessageBody()
    data: { lectureCode: string; studentId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, studentId, name } = data;
    const studentsRoom = this.getStudentsRoom(lectureCode);
    const lectureRoom = this.getLectureRoom(lectureCode);

    try {
      this.logger.log({
        message: '학생 강의실 입장 시도',
        lectureCode,
        studentId,
        name,
      });

      // 강의실과 학생 room에 입장
      client.join(studentsRoom);
      client.join(lectureRoom);

      // Redis에 학생 정보 저장
      await this.redisService.saveStudent(lectureCode, studentId, name);

      // 기존 코드 확인
      let code = await this.redisService.getStudentCode(lectureCode, studentId);

      // 기존 코드가 없는 경우에만 기본 코드 저장
      if (!code) {
        code = `# 여기에 드론을 제어하는 코드를 작성하세요
# 예시:
# drone.takeoff()
# drone.move_forward(1)
# drone.turn_right(90)
# drone.land()`;
        await this.redisService.saveStudentCode(lectureCode, studentId, code);
      }

      // 현재 접속중인 모든 학생 목록 조회
      const students = await this.redisService.getStudents(lectureCode);

      // 강사에게 학생 입장 알림 전송 전에 로그 추가
      this.logger.log({
        message: '강사에게 학생 입장 알림 전송 시도',
        event: 'studentJoined',
        data: { lectureCode, studentId, name, students },
      });

      // InstructorGateway를 통해 이벤트 전송
      this.instructorGateway.notifyStudentJoined({
        lectureCode,
        studentId,
        name,
        students,
      });

      // 전송 후 로그
      this.logger.log({
        message: '강사에게 학생 입장 알림 전송 완료',
        lectureCode,
        studentId,
        name,
      });

      // 학생에게 입장 성공 알림 (코드 포함)
      client.emit('joinSuccess', {
        lectureCode,
        message: '강의실 참여에 성공했습니다.',
        code: code, // 저장된 코드 전송
      });

      // 소켓에 학생 정보 저장
      client.data = {
        lectureCode,
        role: 'student',
        studentId,
      };
    } catch (error) {
      this.logger.error({
        message: '학생 강의실 입장 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
      });
      throw error;
    }
  }

  @SubscribeMessage('leaveLecture')
  async handleLeaveLecture(
    @MessageBody() data: { lectureCode: string; studentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, studentId } = data;
    const lectureRoom = this.getLectureRoom(lectureCode);
    const studentsRoom = this.getStudentsRoom(lectureCode);

    // Redis에서 학생 정보 제거
    await this.redisService.removeStudent(lectureCode, studentId);

    // Socket room에서 나가기
    client.leave(lectureRoom);
    client.leave(studentsRoom);

    delete client.data;

    // 현재 접속중인 모든 학생 목록 조회
    const students = await this.redisService.getStudents(lectureCode);

    // 강사에게만 학생 퇴장 알림 (네임스페이스를 통해 전달)
    this.server
      .to(`lecture:${lectureCode}:instructor`) // 특정 강의실 강사 room으로 보냄
      .emit('studentLeft', {
        studentId,
        students,
      });
  }

  @SubscribeMessage('code:submit')
  async handleCodeSubmit(
    @MessageBody()
    data: { lectureCode: string; studentId: string; code: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, studentId, code } = data;

    try {
      this.logger.log({
        message: '학생 코드 제출',
        lectureCode,
        studentId,
        codeLength: code.length,
      });

      // Redis에 코드 저장
      await this.redisService.saveStudentCode(lectureCode, studentId, code);

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // 강사에게 알림
      this.instructorGateway.notifyCodeUpdated({
        lectureCode,
        studentId,
        code,
        students: studentsWithDetails,
      });

      // 학생에게 저장 성공 알림
      client.emit('code:saved', {
        success: true,
        message: '코드가 성공적으로 저장되었습니다.',
      });
    } catch (error) {
      this.logger.error({
        message: '학생 코드 저장 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
      });

      client.emit('code:saved', {
        success: false,
        message: '코드 저장 중 오류가 발생했습니다.',
      });
    }
  }

  @SubscribeMessage('drone:update')
  async handleDroneUpdate(
    @MessageBody()
    data: { lectureCode: string; studentId: string; status: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, studentId, status } = data;

    try {
      this.logger.log({
        message: '학생 드론 상태 업데이트',
        lectureCode,
        studentId,
        status,
      });

      // Redis에 드론 상태 저장
      await this.redisService.saveStudentDroneStatus(
        lectureCode,
        studentId,
        status,
      );

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // 강사에게 알림
      this.instructorGateway.notifyDroneUpdated({
        lectureCode,
        studentId,
        status,
        students: studentsWithDetails,
      });

      // 학생에게 저장 성공 알림
      client.emit('drone:saved', {
        success: true,
        message: '드론 상태가 성공적으로 업데이트되었습니다.',
      });
    } catch (error) {
      this.logger.error({
        message: '학생 드론 상태 업데이트 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
      });

      client.emit('drone:saved', {
        success: false,
        message: '드론 상태 업데이트 중 오류가 발생했습니다.',
      });
    }
  }
}
