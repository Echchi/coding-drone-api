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

@Injectable()
@WebSocketGateway({
  namespace: 'instructor',
  cors: { origin: '*' },
})
export class InstructorGateway {
  private readonly logger = new Logger(InstructorGateway.name);

  constructor(private readonly redisService: RedisService) {}

  @WebSocketServer()
  server: Server;

  // 소켓 연결 시
  handleConnection(client: Socket) {
    this.logger.log(`소켓 연결됨 - socket id: ${client.id}`);
  }

  // 소켓 연결 해제 시
  handleDisconnect(client: Socket) {
    this.logger.log(`소켓 연결 해제됨 - socket id: ${client.id}`);
  }

  private getLectureRoom(lectureCode: string): string {
    return `lecture:${lectureCode}`;
  }

  getInstructorRoom(lectureCode: string): string {
    return `lecture:${lectureCode}:instructor`;
  }

  // 강의실 종료 처리
  async endLecture(lectureCode: string) {
    const lectureRoom = this.getLectureRoom(lectureCode);
    const instructorRoom = this.getInstructorRoom(lectureCode);

    this.logger.log({
      message: '강의실 종료 요청',
      lectureCode,
      lectureRoom,
      instructorRoom,
    });

    try {
      // 강의실의 모든 참여자에게 종료 알림
      this.server.to(lectureRoom).emit('lectureEnded', {
        message: '강의가 종료되었습니다.',
      });

      // Redis에서 강의실 데이터 정리
      await this.redisService.clearLectureData(lectureCode);
      await this.redisService.clearLectureCodes(lectureCode);

      // Socket.IO의 room에서 모든 클라이언트 제거
      const sockets = await this.server.in(lectureRoom).fetchSockets();
      this.logger.debug({
        message: '강의실 연결 소켓 정보',
        lectureCode,
        socketCount: sockets.length,
      });

      for (const socket of sockets) {
        socket.leave(lectureRoom);
        socket.leave(instructorRoom);
      }

      this.logger.log({
        message: '강의실 종료 완료',
        lectureCode,
      });
    } catch (error) {
      this.logger.error({
        message: '강의실 종료 중 오류 발생',
        lectureCode,
        error: error.message,
      });
      throw error;
    }
  }

  @SubscribeMessage('joinLecture')
  async handleJoin(
    @MessageBody() data: { lectureCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode } = data;
    const instructorRoom = this.getInstructorRoom(lectureCode);

    try {
      this.logger.log({
        message: '강사 강의실 입장 시도',
        lectureCode,
        socketId: client.id,
      });

      client.join(instructorRoom);

      // Redis에서 현재 접속중인 학생 목록 조회
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      this.logger.log({
        message: '현재 접속중인 학생 목록 조회',
        lectureCode,
        studentsWithDetails,
      });

      // room 참여 확인
      const rooms = Array.from(client.rooms);
      this.logger.debug({
        message: '소켓 room 참여 상태',
        socketId: client.id,
        rooms,
      });

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([studentId, details]) => ({
          studentId,
          name: details.name,
          code: details.code,
          droneStatus: details.droneStatus,
          isConnected: true, // 연결 상태는 현재는 모두 true로 설정
        }),
      );

      // 응답 보내기 (학생 목록 포함)
      client.emit('joinResponse', {
        success: true,
        message: '강의실 입장 완료',
        rooms: rooms,
        students: formattedStudents, // 상세 정보를 포함한 학생 목록 전달
      });

      client.data = {
        lectureCode: lectureCode,
        role: 'instructor',
      };

      this.logger.log({
        message: '강사 강의실 입장 완료',
        lectureCode,
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error({
        message: '강의실 입장 중 오류 발생',
        lectureCode,
        socketId: client.id,
        error: error.message,
      });
      throw error;
    }
  }

  @SubscribeMessage('instructorNotify')
  async handleInstructorNotify(
    @MessageBody() data: { event: string; data: any },
  ) {
    const { event, data: eventData } = data;
    const { lectureCode } = eventData;

    // 해당 강의실의 강사에게만 전달
    this.server.to(`lecture:${lectureCode}:instructor`).emit(event, eventData);
  }

  @SubscribeMessage('studentJoined')
  async handleStudentJoined(
    @MessageBody()
    data: {
      lectureCode: string;
      studentId: string;
      name: string;
      students: any;
    },
  ) {
    const { lectureCode } = data;
    const instructorRoom = this.getInstructorRoom(lectureCode);

    this.logger.log({
      message: '학생 입장 이벤트 수신',
      event: 'studentJoined',
      data,
    });

    // 해당 강의실의 강사에게 전달
    this.server.to(instructorRoom).emit('studentJoined', data);
  }

  // 학생 입장 알림을 보내는 메서드
  async notifyStudentJoined(data: {
    lectureCode: string;
    studentId: string;
    name: string;
    students: any;
  }) {
    try {
      const instructorRoom = this.getInstructorRoom(data.lectureCode);

      // 학생 상세 정보를 가져옴 (이름, 코드, 드론 상태)
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(data.lectureCode);

      this.logger.log({
        message: '강사에게 학생 입장 알림 전송',
        room: instructorRoom,
        studentsWithDetails,
      });

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([studentId, details]) => ({
          studentId,
          name: details.name,
          code: details.code,
          droneStatus: details.droneStatus,
          isConnected: true, // 연결 상태는 현재는 모두 true로 설정
        }),
      );

      this.server.to(instructorRoom).emit('studentJoined', {
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        name: data.name,
        students: formattedStudents,
      });
    } catch (error) {
      this.logger.error({
        message: '학생 입장 알림 전송 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 학생 코드 업데이트 알림을 보내는 메서드
  async notifyCodeUpdated(data: {
    lectureCode: string;
    studentId: string;
    code: string;
    students: any;
  }) {
    try {
      const instructorRoom = this.getInstructorRoom(data.lectureCode);

      this.logger.log({
        message: '강사에게 학생 코드 업데이트 알림 전송',
        room: instructorRoom,
        studentId: data.studentId,
        codeLength: data.code.length,
      });

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(data.students).map(
        ([studentId, details]) => ({
          studentId,
          name: details.name,
          code: details.code,
          droneStatus: details.droneStatus,
          isConnected: true,
        }),
      );

      this.server.to(instructorRoom).emit('code:updated', {
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        code: data.code,
        students: formattedStudents,
      });
    } catch (error) {
      this.logger.error({
        message: '학생 코드 업데이트 알림 전송 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 학생 드론 상태 업데이트 알림을 보내는 메서드
  async notifyDroneUpdated(data: {
    lectureCode: string;
    studentId: string;
    status: string;
    students: any;
  }) {
    try {
      const instructorRoom = this.getInstructorRoom(data.lectureCode);

      this.logger.log({
        message: '강사에게 학생 드론 상태 업데이트 알림 전송',
        room: instructorRoom,
        studentId: data.studentId,
        status: data.status,
      });

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(data.students).map(
        ([studentId, details]) => ({
          studentId,
          name: details.name,
          code: details.code,
          droneStatus: details.droneStatus,
          isConnected: true,
        }),
      );

      this.server.to(instructorRoom).emit('drone:updated', {
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        status: data.status,
        students: formattedStudents,
      });
    } catch (error) {
      this.logger.error({
        message: '학생 드론 상태 업데이트 알림 전송 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }
}
