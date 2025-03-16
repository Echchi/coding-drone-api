import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EventsService } from '../events/events.service';

@Injectable()
@WebSocketGateway({
  namespace: 'instructor',
  cors: { origin: '*' },
})
export class InstructorGateway implements OnModuleInit {
  private readonly logger = new Logger(InstructorGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly eventsService: EventsService,
  ) {}

  @WebSocketServer()
  server: Server;

  // 모듈 초기화 시 이벤트 리스너 등록
  onModuleInit() {
    this.logger.log('InstructorGateway 모듈 초기화 및 이벤트 리스너 등록 시작');

    // 학생 입장 이벤트 리스닝
    this.eventsService.eventEmitter.on('student.joined', (data) => {
      this.handleStudentJoinedEvent(data);
    });

    // 학생 퇴장 이벤트 리스닝
    this.eventsService.eventEmitter.on('student.left', (data) => {
      this.handleStudentLeftEvent(data);
    });

    // 코드 업데이트 이벤트 리스닝
    this.eventsService.eventEmitter.on('code.updated', (data) => {
      this.handleCodeUpdatedEvent(data);
    });

    // 드론 상태 업데이트 이벤트 리스닝
    this.eventsService.eventEmitter.on('drone.updated', (data) => {
      this.handleDroneUpdatedEvent(data);
    });

    // 코드 활성화 상태 변경 이벤트 리스닝
    this.eventsService.eventEmitter.on('code.active.changed', (data) => {
      this.handleCodeActiveChangedEvent(data);
    });

    // 드론 활성화 상태 변경 이벤트 리스닝
    this.eventsService.eventEmitter.on('drone.active.changed', (data) => {
      this.handleDroneActiveChangedEvent(data);
    });

    this.logger.log('InstructorGateway 모듈 이벤트 리스너 등록 완료');
  }

  // 내부 이벤트 핸들러: 학생 입장
  private async handleStudentJoinedEvent(data: any) {
    try {
      const instructorRoom = this.getInstructorRoom(data.lectureCode);

      this.logger.log({
        message: '이벤트 수신: student.joined',
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        name: data.name,
      });

      // students 배열에 codeActive와 droneActive 정보가 있는지 확인
      const studentsWithActivation = data.students.map((student) => {
        // 각 학생 객체에 codeActive와 droneActive가 없는 경우 기본값 추가
        if (student.codeActive === undefined) {
          this.logger.debug({
            message: '학생 객체에 codeActive 필드가 없어 기본값 true 설정',
            studentId: student.studentId,
          });
          student.codeActive = true;
        }

        if (student.droneActive === undefined) {
          this.logger.debug({
            message: '학생 객체에 droneActive 필드가 없어 기본값 true 설정',
            studentId: student.studentId,
          });
          student.droneActive = true;
        }

        return student;
      });

      this.server.to(instructorRoom).emit('studentJoined', {
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        name: data.name,
        students: studentsWithActivation,
      });

      this.logger.log({
        message: '강사에게 학생 입장 알림 전송 완료 (이벤트 경유)',
        lectureCode: data.lectureCode,
        studentId: data.studentId,
      });
    } catch (error) {
      this.logger.error({
        message: '학생 입장 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 내부 이벤트 핸들러: 학생 퇴장
  private async handleStudentLeftEvent(data: any) {
    try {
      const instructorRoom = this.getInstructorRoom(data.lectureCode);

      this.logger.log({
        message: '이벤트 수신: student.left',
        lectureCode: data.lectureCode,
        studentId: data.studentId,
      });

      this.server.to(instructorRoom).emit('studentLeft', {
        studentId: data.studentId,
        students: data.students,
      });

      this.logger.log({
        message: '강사에게 학생 퇴장 알림 전송 완료 (이벤트 경유)',
        lectureCode: data.lectureCode,
        studentId: data.studentId,
      });
    } catch (error) {
      this.logger.error({
        message: '학생 퇴장 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 내부 이벤트 핸들러: 코드 업데이트
  private async handleCodeUpdatedEvent(data: any) {
    try {
      const instructorRoom = this.getInstructorRoom(data.lectureCode);

      this.logger.log({
        message: '이벤트 수신: code.updated',
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        codeLength: data.code?.length || 0,
      });

      this.server.to(instructorRoom).emit('code:updated', {
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        code: data.code,
        students: data.students,
      });

      this.logger.log({
        message: '강사에게 코드 업데이트 알림 전송 완료 (이벤트 경유)',
        lectureCode: data.lectureCode,
        studentId: data.studentId,
      });
    } catch (error) {
      this.logger.error({
        message: '코드 업데이트 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 내부 이벤트 핸들러: 드론 상태 업데이트
  private async handleDroneUpdatedEvent(data: any) {
    try {
      const instructorRoom = this.getInstructorRoom(data.lectureCode);

      this.logger.log({
        message: '이벤트 수신: drone.updated',
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        status: data.status,
      });

      this.server.to(instructorRoom).emit('drone:updated', {
        lectureCode: data.lectureCode,
        studentId: data.studentId,
        status: data.status,
        students: data.students,
      });

      this.logger.log({
        message: '강사에게 드론 상태 업데이트 알림 전송 완료 (이벤트 경유)',
        lectureCode: data.lectureCode,
        studentId: data.studentId,
      });
    } catch (error) {
      this.logger.error({
        message: '드론 상태 업데이트 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 내부 이벤트 핸들러: 코드 활성화 상태 변경
  private async handleCodeActiveChangedEvent(data: any) {
    try {
      const { lectureCode, studentId, active } = data;

      // 이미 instructor가 처리했으므로 여기서는 로깅만 하고 끝냅니다
      this.logger.log({
        message: '이벤트 수신: code.active.changed (이미 처리됨)',
        lectureCode,
        studentId,
        active,
      });

      // 메시지 전송 코드 삭제
    } catch (error) {
      this.logger.error({
        message: '코드 활성화 상태 변경 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 내부 이벤트 핸들러: 드론 활성화 상태 변경
  private async handleDroneActiveChangedEvent(data: any) {
    try {
      const { lectureCode, studentId, active } = data;

      // 이미 instructor가 처리했으므로 여기서는 로깅만 하고 끝냅니다
      this.logger.log({
        message: '이벤트 수신: drone.active.changed (이미 처리됨)',
        lectureCode,
        studentId,
        active,
      });

      // 메시지 전송 코드 삭제
    } catch (error) {
      this.logger.error({
        message: '드론 활성화 상태 변경 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 소켓 연결 시
  handleConnection(client: Socket) {
    console.log(`📡 InstructorGateway - 소켓 연결 됨: ${client.id}`);
    console.log('네임스페이스:', client.nsp.name);
    console.log('연결 정보:', {
      handshake: client.handshake.query,
      rooms: Array.from(client.rooms),
    });

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

  private getStudentsRoom(lectureCode: string): string {
    return `lecture:${lectureCode}:students`;
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
  async handleJoinLecture(
    @MessageBody()
    data: { lectureCode: string; studentId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, studentId } = data;
    const studentsRoom = this.getStudentsRoom(lectureCode);
    const lectureRoom = this.getLectureRoom(lectureCode);
    const studentPersonalRoom = this.getStudentPersonalRoom(
      lectureCode,
      studentId,
    );
    const instructorRoom = this.getInstructorRoom(lectureCode);

    try {
      this.logger.log({
        message: '강사 강의실 입장 시도',
        lectureCode,
        socketId: client.id,
      });

      client.join(studentsRoom);
      client.join(lectureRoom);
      client.join(studentPersonalRoom);
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

      // IStudent 형태로 변환 (코드 활성화, 드론 활성화 상태 포함)
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([studentId, details]) => ({
          studentId,
          name: (details as any).name,
          code: (details as any).code,
          droneStatus: (details as any).droneStatus,
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
          isConnected: true, // 연결 상태는 현재는 모두 true로 설정
        }),
      );

      // 응답 보내기 (학생 목록 포함)
      client.emit('joinResponse', {
        success: true,
        message: '강의실 입장 완료',
        rooms: rooms,
        students: formattedStudents, // 코드/드론 활성화 상태를 포함한 학생 목록 전달
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

      // 입장 후 현재 가입된 모든 방 정보 로깅
      this.logger.debug({
        message: '학생 소켓 방 가입 상태',
        studentId,
        rooms: Array.from(client.rooms), // 모든 방 목록 확인
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

      // IStudent 형태로 변환 (코드 활성화, 드론 활성화 상태 포함)
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([studentId, details]) => ({
          studentId,
          name: details.name,
          code: details.code,
          droneStatus: details.droneStatus,
          codeActive: details.codeActive,
          droneActive: details.droneActive,
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
          name: (details as any).name,
          code: (details as any).code,
          droneStatus: (details as any).droneStatus,
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
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
          name: (details as any).name,
          code: (details as any).code,
          droneStatus: (details as any).droneStatus,
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
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

  // 학생 코드 활성화 상태 설정
  @SubscribeMessage('code:setActive')
  async handleSetCodeActive(
    @MessageBody()
    data: { lectureCode: string; studentId: string; active: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('📥 code:setActive 이벤트 수신:', data);
    const { lectureCode, studentId, active } = data;

    try {
      this.logger.log({
        message: '학생 코드 활성화 상태 설정',
        lectureCode,
        studentId,
        active,
        clientId: client.id,
      });

      // Redis에 코드 활성화 상태 저장
      await this.redisService.saveStudentCodeActive(
        lectureCode,
        studentId,
        active,
      );

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([studentId, details]) => ({
          studentId,
          name: (details as any).name,
          code: (details as any).code,
          droneStatus: (details as any).droneStatus,
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
          isConnected: true,
        }),
      );

      // 내부 이벤트 발생
      this.eventsService.emitCodeActiveChanged({
        lectureCode,
        studentId,
        active,
        students: formattedStudents,
      });

      // 강사에게 알림
      this.server
        .to(this.getInstructorRoom(lectureCode))
        .emit('code:activeChanged', {
          lectureCode,
          studentId,
          active,
          students: formattedStudents,
        });

      const studentPersonalRoom = this.getStudentPersonalRoom(
        lectureCode,
        studentId,
      );

      this.server.to(studentPersonalRoom).emit('code:activeChanged', {
        active,
        studentId,
        lectureCode,
        message: `코드 편집이 ${active ? '활성화' : '비활성화'}되었습니다.`,
      });

      client.emit('code:activeChangedSuccess', {
        success: true,
        message: `학생 코드 ${active ? '활성화' : '비활성화'} 성공`,
      });

      this.logger.log({
        message: '특정 학생에게 코드 활성화 상태 변경 알림 전송 완료',
        lectureCode,
        studentId,
        active,
      });
    } catch (error) {
      this.logger.error({
        message: '학생 코드 활성화 상태 설정 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
      });

      client.emit('code:activeChangedSuccess', {
        success: false,
        message: '학생 코드 활성화 상태 설정 중 오류가 발생했습니다.',
      });
    }
  }

  // 모든 학생 코드 활성화 상태 설정
  @SubscribeMessage('code:setAllActive')
  async handleSetAllCodeActive(
    @MessageBody()
    data: { lectureCode: string; active: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, active } = data;

    try {
      this.logger.log({
        message: '모든 학생 코드 활성화 상태 설정',
        lectureCode,
        active,
      });

      // Redis에 모든 학생 코드 활성화 상태 저장
      await this.redisService.setAllCodeActive(lectureCode, active);

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([studentId, details]) => ({
          studentId,
          name: (details as any).name,
          code: (details as any).code,
          droneStatus: (details as any).droneStatus,
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
          isConnected: true,
        }),
      );

      // 내부 이벤트 발생 - 모든 학생 코드 활성화 상태 변경
      this.logger.log({
        message: '내부 이벤트 발생: code.all.active.changed',
        lectureCode,
        active: active,
      });
      this.eventsService.emitAllCodeActiveChanged({
        lectureCode,
        active: active,
        students: formattedStudents,
      });

      // 강사에게 알림
      this.server
        .to(this.getInstructorRoom(lectureCode))
        .emit('code:allActiveChanged', {
          lectureCode,
          active,
          students: formattedStudents,
        });

      // 학생에게 알림 (기존 방식 유지 - 클라이언트 호환성)
      this.server
        .to(`lecture:${lectureCode}:students`)
        .emit('code:activeChanged', {
          active: active,
          lectureCode,
          message: `모든 학생의 코드 편집이 ${active ? '활성화' : '비활성화'}되었습니다.`,
        });

      client.emit('code:allActiveChangedSuccess', {
        success: true,
        message: `모든 학생 코드 ${active ? '활성화' : '비활성화'} 성공`,
      });
    } catch (error) {
      this.logger.error({
        message: '모든 학생 코드 활성화 상태 설정 중 오류 발생',
        lectureCode,
        error: error.message,
      });

      client.emit('code:allActiveChangedSuccess', {
        success: false,
        message: '모든 학생 코드 활성화 상태 설정 중 오류가 발생했습니다.',
      });
    }
  }

  // 학생 드론 활성화 상태 설정
  @SubscribeMessage('drone:setActive')
  async handleSetDroneActive(
    @MessageBody()
    data: { lectureCode: string; studentId: string; active: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('📥 drone:setActive 이벤트 수신:', data);
    const { lectureCode, studentId, active } = data;

    try {
      this.logger.log({
        message: '학생 드론 활성화 상태 설정',
        lectureCode,
        studentId,
        active,
        clientId: client.id,
      });

      // Redis에 드론 활성화 상태 저장
      await this.redisService.saveStudentDroneActive(
        lectureCode,
        studentId,
        active,
      );

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([studentId, details]) => ({
          studentId,
          name: (details as any).name,
          code: (details as any).code,
          droneStatus: (details as any).droneStatus,
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
          isConnected: true,
        }),
      );

      // 내부 이벤트 발생
      this.eventsService.emitDroneActiveChanged({
        lectureCode,
        studentId,
        active,
        students: formattedStudents,
      });

      // 강사에게 알림
      this.server
        .to(this.getInstructorRoom(lectureCode))
        .emit('drone:activeChanged', {
          lectureCode,
          studentId,
          active,
          students: formattedStudents,
        });

      // 학생에게 알림 (Socket.IO 직접 통신)
      this.server
        .to(`lecture:${lectureCode}:student:${studentId}`)
        .emit('drone:activeChanged', {
          active,
          studentId,
          lectureCode,
          message: `드론 제어가 ${active ? '활성화' : '비활성화'}되었습니다.`,
        });

      client.emit('drone:activeChangedSuccess', {
        success: true,
        message: `학생 드론 ${active ? '활성화' : '비활성화'} 성공`,
      });
    } catch (error) {
      this.logger.error({
        message: '학생 드론 활성화 상태 설정 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
      });

      client.emit('drone:activeChangedSuccess', {
        success: false,
        message: '학생 드론 활성화 상태 설정 중 오류가 발생했습니다.',
      });
    }
  }

  // 모든 학생 드론 활성화 상태 설정
  @SubscribeMessage('drone:setAllActive')
  async handleSetAllDroneActive(
    @MessageBody()
    data: { lectureCode: string; active: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, active } = data;

    try {
      this.logger.log({
        message: '모든 학생 드론 활성화 상태 설정',
        lectureCode,
        active,
      });

      // Redis에 모든 학생 드론 활성화 상태 저장
      await this.redisService.setAllDroneActive(lectureCode, active);

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([studentId, details]) => ({
          studentId,
          name: (details as any).name,
          code: (details as any).code,
          droneStatus: (details as any).droneStatus,
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
          isConnected: true,
        }),
      );

      // 내부 이벤트 발생 - 모든 학생 드론 활성화 상태 변경
      this.logger.log({
        message: '내부 이벤트 발생: drone.all.active.changed',
        lectureCode,
        active: active,
      });
      this.eventsService.emitAllDroneActiveChanged({
        lectureCode,
        active: active,
        students: formattedStudents,
      });

      // 강사에게 알림
      this.server
        .to(this.getInstructorRoom(lectureCode))
        .emit('drone:allActiveChanged', {
          lectureCode,
          active,
          students: formattedStudents,
        });

      // 학생에게 알림 (기존 방식 유지 - 클라이언트 호환성)
      this.server
        .to(`lecture:${lectureCode}:students`)
        .emit('drone:activeChanged', {
          active: active,
          lectureCode,
          message: `모든 학생의 드론 제어가 ${active ? '활성화' : '비활성화'}되었습니다.`,
        });

      client.emit('drone:allActiveChangedSuccess', {
        success: true,
        message: `모든 학생 드론 ${active ? '활성화' : '비활성화'} 성공`,
      });
    } catch (error) {
      this.logger.error({
        message: '모든 학생 드론 활성화 상태 설정 중 오류 발생',
        lectureCode,
        error: error.message,
      });

      client.emit('drone:allActiveChangedSuccess', {
        success: false,
        message: '모든 학생 드론 활성화 상태 설정 중 오류가 발생했습니다.',
      });
    }
  }

  // 강사가 학생 코드를 직접 수정
  @SubscribeMessage('code:instructorEdit')
  async handleInstructorCodeEdit(
    @MessageBody()
    data: { lectureCode: string; studentId: string; code: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, studentId, code } = data;
    const studentPersonalRoom = `lecture:${lectureCode}:student:${studentId}`;

    try {
      this.logger.log({
        message: '강사가 학생 코드 직접 수정',
        lectureCode,
        studentId,
        codeLength: code.length,
        instructorId: client.id,
      });

      // Redis에 코드 저장
      await this.redisService.saveStudentCode(lectureCode, studentId, code);

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // IStudent 형태로 변환
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([sid, details]) => ({
          studentId: sid,
          name: (details as any).name,
          code: (details as any).code,
          droneStatus: (details as any).droneStatus,
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
          isConnected: true,
        }),
      );

      // 내부 이벤트 발생 - 코드가 강사에 의해 수정됨
      this.logger.log({
        message: '내부 이벤트 발생: code.updated.by.instructor',
        lectureCode,
        studentId,
      });

      // 내부 이벤트 발생 (기존 이벤트 재사용)
      this.eventsService.emitCodeUpdated({
        lectureCode,
        studentId,
        code,
        students: formattedStudents,
      });

      // 강사에게 알림
      this.server
        .to(this.getInstructorRoom(lectureCode))
        .emit('code:instructorEditSuccess', {
          lectureCode,
          studentId,
          code,
          students: formattedStudents,
          message: '학생 코드가 성공적으로 수정되었습니다.',
        });

      // 해당 학생에게 알림 (Socket.IO 직접 통신)
      this.server.to(studentPersonalRoom).emit('code:updatedByInstructor', {
        code,
        lectureCode,
        message: '강사가 코드를 수정했습니다.',
      });

      // 성공 응답
      client.emit('code:instructorEditSuccess', {
        success: true,
        message: '학생 코드 수정 성공',
        studentId,
      });
    } catch (error) {
      this.logger.error({
        message: '강사의 학생 코드 수정 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
        stack: error.stack,
      });

      client.emit('code:instructorEditSuccess', {
        success: false,
        message: '학생 코드 수정 중 오류가 발생했습니다.',
      });
    }
  }

  // 개인 룸 헬퍼 메서드 추가
  private getStudentPersonalRoom(
    lectureCode: string,
    studentId: string,
  ): string {
    return `lecture:${lectureCode}:student:${studentId}`;
  }
}
