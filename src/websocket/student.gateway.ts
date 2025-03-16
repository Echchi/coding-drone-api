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
  namespace: 'student',
  cors: { origin: '*' },
})
export class StudentGateway implements OnModuleInit {
  private readonly logger = new Logger(StudentGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly eventsService: EventsService,
  ) {}

  @WebSocketServer()
  server: Server;

  // 모듈 초기화 시 이벤트 리스너 등록
  onModuleInit() {
    this.logger.log('StudentGateway 모듈 초기화 및 이벤트 리스너 등록 시작');

    // 코드 활성화 상태 변경 이벤트 리스닝
    this.eventsService.eventEmitter.on('code.active.changed', (data) => {
      this.handleCodeActiveChangedEvent(data);
    });

    // 드론 활성화 상태 변경 이벤트 리스닝
    this.eventsService.eventEmitter.on('drone.active.changed', (data) => {
      this.handleDroneActiveChangedEvent(data);
    });

    // 모든 학생 코드 활성화 상태 변경 이벤트 리스닝
    this.eventsService.eventEmitter.on('code.all.active.changed', (data) => {
      this.handleAllCodeActiveChangedEvent(data);
    });

    // 모든 학생 드론 활성화 상태 변경 이벤트 리스닝
    this.eventsService.eventEmitter.on('drone.all.active.changed', (data) => {
      this.handleAllDroneActiveChangedEvent(data);
    });

    this.logger.log('StudentGateway 모듈 이벤트 리스너 등록 완료');
  }

  // 내부 이벤트 핸들러: 코드 활성화 상태 변경
  private async handleCodeActiveChangedEvent(data: any) {
    try {
      const { lectureCode, studentId, active } = data;
      // 특정 학생의 개인 룸을 가져옴
      const studentPersonalRoom = this.getStudentPersonalRoom(
        lectureCode,
        studentId,
      );

      this.logger.log({
        message: '이벤트 수신: code.active.changed',
        lectureCode,
        studentId,
        active,
        targetRoom: studentPersonalRoom,
      });

      // 특정 학생에게만 알림 전송
      this.server.to(studentPersonalRoom).emit('code:activeChanged', {
        active,
        studentId,
        lectureCode,
        message: `코드 편집이 ${active ? '활성화' : '비활성화'}되었습니다.`,
      });

      this.logger.log({
        message: '특정 학생에게 코드 활성화 상태 변경 알림 전송 완료',
        lectureCode,
        studentId,
        active,
      });
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
      // 특정 학생의 개인 룸을 가져옴
      const studentPersonalRoom = this.getStudentPersonalRoom(
        lectureCode,
        studentId,
      );

      this.logger.log({
        message: '이벤트 수신: drone.active.changed',
        lectureCode,
        studentId,
        active,
        targetRoom: studentPersonalRoom,
      });

      // 특정 학생에게만 알림 전송
      this.server.to(studentPersonalRoom).emit('drone:activeChanged', {
        active,
        studentId,
        lectureCode,
        message: `드론 제어가 ${active ? '활성화' : '비활성화'}되었습니다.`,
      });

      this.logger.log({
        message: '특정 학생에게 드론 활성화 상태 변경 알림 전송 완료',
        lectureCode,
        studentId,
        active,
      });
    } catch (error) {
      this.logger.error({
        message: '드론 활성화 상태 변경 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  // 내부 이벤트 핸들러: 모든 학생 코드 활성화 상태 변경
  private async handleAllCodeActiveChangedEvent(data: any) {
    try {
      // active 값을 명시적으로 로깅
      console.log('🔍 수신된 code.all.active.changed 이벤트 데이터:', data);

      const { lectureCode, active } = data;
      const studentsRoom = this.getStudentsRoom(lectureCode);

      this.logger.log({
        message: '이벤트 수신: code.all.active.changed',
        lectureCode,
        active: active, // 명시적으로 로깅
        studentsRoom,
      });

      // 학생 방에 알림 전송 (모든 학생에게 변경 통지)
      this.server.to(studentsRoom).emit('code:activeChanged', {
        active: active, // 명시적으로 active 값을 설정
        lectureCode,
        message: `모든 학생의 코드 편집이 ${active ? '활성화' : '비활성화'}되었습니다.`,
      });

      this.logger.log({
        message:
          '모든 학생에게 코드 활성화 상태 변경 알림 전송 완료 (이벤트 경유)',
        lectureCode,
        active: active, // 명시적으로 로깅
        sentData: { active: active }, // 실제 전송된 데이터 로깅
      });
    } catch (error) {
      this.logger.error({
        message: '모든 학생 코드 활성화 상태 변경 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
        receivedData: data, // 수신된 원본 데이터를 로깅
      });
    }
  }

  // 내부 이벤트 핸들러: 모든 학생 드론 활성화 상태 변경
  private async handleAllDroneActiveChangedEvent(data: any) {
    try {
      // active 값을 명시적으로 로깅
      console.log('🔍 수신된 drone.all.active.changed 이벤트 데이터:', data);

      const { lectureCode, active } = data;
      const studentsRoom = this.getStudentsRoom(lectureCode);

      this.logger.log({
        message: '이벤트 수신: drone.all.active.changed',
        lectureCode,
        active: active, // 명시적으로 로깅
        studentsRoom,
      });

      // 학생 방에 알림 전송 (모든 학생에게 변경 통지)
      this.server.to(studentsRoom).emit('drone:activeChanged', {
        active: active, // 명시적으로 active 값을 설정
        lectureCode,
        message: `모든 학생의 드론 제어가 ${active ? '활성화' : '비활성화'}되었습니다.`,
      });

      this.logger.log({
        message:
          '모든 학생에게 드론 활성화 상태 변경 알림 전송 완료 (이벤트 경유)',
        lectureCode,
        active: active, // 명시적으로 로깅
        sentData: { active: active }, // 실제 전송된 데이터 로깅
      });
    } catch (error) {
      this.logger.error({
        message: '모든 학생 드론 활성화 상태 변경 이벤트 처리 중 오류 발생',
        error: error.message,
        stack: error.stack,
        receivedData: data, // 수신된 원본 데이터를 로깅
      });
    }
  }

  private getLectureRoom(lectureCode: string): string {
    return `lecture:${lectureCode}`;
  }

  private getStudentsRoom(lectureCode: string): string {
    return `lecture:${lectureCode}:students`;
  }

  private getStudentPersonalRoom(
    lectureCode: string,
    studentId: string,
  ): string {
    return `lecture:${lectureCode}:student:${studentId}`;
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
    const studentPersonalRoom = this.getStudentPersonalRoom(
      lectureCode,
      studentId,
    );

    try {
      this.logger.log({
        message: '학생 강의실 입장 시도',
        lectureCode,
        studentId,
        name,
      });

      // 강의실과 학생 room에 입장 + 개인 룸 추가
      client.join(studentsRoom);
      client.join(lectureRoom);
      client.join(studentPersonalRoom);

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

      // 기존 코드/드론 활성화 상태 확인
      let codeActive = await this.redisService.getStudentCodeActive(
        lectureCode,
        studentId,
      );
      let droneActive = await this.redisService.getStudentDroneActive(
        lectureCode,
        studentId,
      );

      // 저장된 값이 없는 경우에만 기본값(활성화) 설정
      if (codeActive === null || codeActive === undefined) {
        this.logger.log({
          message: '코드 활성화 상태 기본값 설정',
          lectureCode,
          studentId,
          defaultValue: true,
        });
        await this.redisService.saveStudentCodeActive(
          lectureCode,
          studentId,
          true,
        );
        codeActive = true;
      } else {
        this.logger.log({
          message: '기존 코드 활성화 상태 유지',
          lectureCode,
          studentId,
          value: codeActive,
        });
      }

      if (droneActive === null || droneActive === undefined) {
        this.logger.log({
          message: '드론 활성화 상태 기본값 설정',
          lectureCode,
          studentId,
          defaultValue: true,
        });
        await this.redisService.saveStudentDroneActive(
          lectureCode,
          studentId,
          true,
        );
        droneActive = true;
      } else {
        this.logger.log({
          message: '기존 드론 활성화 상태 유지',
          lectureCode,
          studentId,
          value: droneActive,
        });
      }

      // 현재 접속중인 모든 학생 목록 조회 및 상세 정보 조회
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // 객체를 배열로 변환 (강사 클라이언트가 기대하는 형식)
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([sid, details]) => ({
          studentId: sid,
          name: (details as any).name || '',
          code: (details as any).code || '',
          droneStatus: (details as any).droneStatus || 'disconnected',
          codeActive: (details as any).codeActive,
          droneActive: (details as any).droneActive,
          isConnected: true,
        }),
      );

      // 강사에게 학생 입장 알림 전송 전에 로그 추가
      this.logger.log({
        message: '강사에게 학생 입장 알림 전송 시도',
        event: 'studentJoined',
        data: { lectureCode, studentId, name, students: formattedStudents },
      });

      // 내부 이벤트 발생
      this.eventsService.emitStudentJoined({
        lectureCode,
        studentId,
        name,
        students: formattedStudents,
      });

      // Socket.IO 이벤트도 계속 발생 (클라이언트 호환성 유지)
      this.server.emit('studentJoined', {
        lectureCode,
        studentId,
        name,
        students: formattedStudents,
      });

      // 학생에게 입장 성공 알림 (코드 포함)
      client.emit('joinResponse', {
        lectureCode,
        message: '강의실 참여에 성공했습니다.',
        code: code, // 저장된 코드 전송
        codeActive: codeActive, // 코드 활성화 상태 추가
        droneActive: droneActive, // 드론 활성화 상태 추가
      });

      // 소켓에 학생 정보 저장
      client.data = {
        lectureCode,
        role: 'student',
        studentId,
      };

      // 내부 이벤트 발생 (코드 업데이트)
      this.eventsService.emitCodeUpdated({
        lectureCode,
        studentId,
        code,
        students: formattedStudents,
      });

      // Socket.IO 이벤트도 계속 발생 (클라이언트 호환성 유지)
      this.server.emit('code:updated', {
        lectureCode,
        studentId,
        code,
        students: formattedStudents,
      });

      this.logger.log({
        message: '학생 강의실 입장 및 코드 초기화 완료',
        lectureCode,
        studentId,
        name,
      });
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

    try {
      // Redis에서 학생 정보 제거
      await this.redisService.removeStudent(lectureCode, studentId);

      // Socket room에서 나가기
      client.leave(lectureRoom);
      client.leave(studentsRoom);

      delete client.data;

      // 현재 접속중인 모든 학생 목록 조회
      const students = await this.redisService.getStudents(lectureCode);

      // 내부 이벤트 발생
      this.logger.log({
        message: '내부 이벤트 발생: student.left',
        lectureCode,
        studentId,
      });

      this.eventsService.emitStudentLeft({
        lectureCode,
        studentId,
        students: Array.isArray(students) ? students : [students],
      });

      // Socket.IO 이벤트도 계속 발생 (클라이언트 호환성 유지)
      this.server.to(`lecture:${lectureCode}:instructor`).emit('studentLeft', {
        studentId,
        students,
      });

      this.logger.log({
        message: '학생 강의실 퇴장 완료',
        lectureCode,
        studentId,
      });
    } catch (error) {
      this.logger.error({
        message: '학생 퇴장 처리 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
      });
    }
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
        client: client.id,
        rooms: Array.from(client.rooms),
      });

      // 코드 활성화 상태 확인
      const codeActive = await this.redisService.getStudentCodeActive(
        lectureCode,
        studentId,
      );

      this.logger.log({
        message: '코드 활성화 상태 확인',
        lectureCode,
        studentId,
        codeActive,
      });

      // 비활성화된 경우 코드 제출 거부
      if (!codeActive) {
        this.logger.log({
          message: '코드 제출 거부 - 비활성화 상태',
          lectureCode,
          studentId,
        });

        client.emit('code:saved', {
          success: false,
          message: '현재 코드 제출이 비활성화되어 있습니다.',
        });
        return;
      }

      // Redis에 코드 저장
      await this.redisService.saveStudentCode(lectureCode, studentId, code);

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // 객체를 배열로 변환 (강사 클라이언트가 기대하는 형식)
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([sid, details]) => ({
          studentId: sid,
          name: (details as any).name || '',
          code: (details as any).code || '',
          droneStatus: (details as any).droneStatus || 'disconnected',
          isConnected: true,
          droneActive: (details as any).droneActive,
          codeActive: (details as any).codeActive,
        }),
      );

      // 내부 이벤트 발생
      this.eventsService.emitCodeUpdated({
        lectureCode,
        studentId,
        code,
        students: formattedStudents,
      });

      // Socket.IO 이벤트도 계속 발생 (클라이언트 호환성 유지)
      this.server.emit('code:updated', {
        lectureCode,
        studentId,
        code,
        students: formattedStudents,
      });

      // Socket.IO 이벤트도 계속 발생 (클라이언트 호환성 유지) - 특정 방으로
      this.server.to(`lecture:${lectureCode}:instructor`).emit('code:updated', {
        lectureCode,
        studentId,
        code,
        students: formattedStudents,
      });

      // 학생에게 저장 성공 알림
      client.emit('code:saved', {
        success: true,
        message: '코드가 성공적으로 저장되었습니다.',
      });

      this.logger.log({
        message: '학생 코드 저장 및 알림 전송 완료',
        lectureCode,
        studentId,
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

      // 드론 활성화 상태 확인
      const droneActive = await this.redisService.getStudentDroneActive(
        lectureCode,
        studentId,
      );

      // 비활성화된 경우 드론 업데이트 거부
      if (!droneActive) {
        client.emit('drone:saved', {
          success: false,
          message: '현재 드론 제어가 비활성화되어 있습니다.',
        });
        return;
      }

      // Redis에 드론 상태 저장
      await this.redisService.saveStudentDroneStatus(
        lectureCode,
        studentId,
        status,
      );

      // 현재 학생의 모든 정보 가져오기
      const studentsWithDetails =
        await this.redisService.getStudentsWithDetails(lectureCode);

      // 객체를 배열로 변환 (강사 클라이언트가 기대하는 형식)
      const formattedStudents = Object.entries(studentsWithDetails).map(
        ([sid, details]) => ({
          studentId: sid,
          name: (details as any).name || '',
          code: (details as any).code || '',
          droneStatus: (details as any).droneStatus || 'disconnected',
          isConnected: true,
        }),
      );

      // 내부 이벤트 발생
      this.eventsService.emitDroneUpdated({
        lectureCode,
        studentId,
        status,
        students: formattedStudents,
      });

      // Socket.IO 이벤트도 계속 발생 (클라이언트 호환성 유지)
      this.server.emit('drone:updated', {
        lectureCode,
        studentId,
        status,
        students: formattedStudents,
      });

      // Socket.IO 이벤트도 계속 발생 (클라이언트 호환성 유지) - 특정 방으로
      this.server
        .to(`lecture:${lectureCode}:instructor`)
        .emit('drone:updated', {
          lectureCode,
          studentId,
          status,
          students: formattedStudents,
        });

      // 학생에게 저장 성공 알림
      client.emit('drone:saved', {
        success: true,
        message: '드론 상태가 성공적으로 업데이트되었습니다.',
      });

      this.logger.log({
        message: '학생 드론 상태 업데이트 및 알림 전송 완료',
        lectureCode,
        studentId,
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

  /**
   * 학생들에게 코드 활성화 상태 변경을 알립니다.
   * 강사가 코드 활성화를 토글할 때 호출됩니다.
   */
  async notifyCodeActiveChanged(
    lectureCode: string,
    studentId: string,
    active: boolean,
  ) {
    try {
      this.logger.log({
        message: '학생에게 코드 활성화 상태 변경 알림 전송',
        lectureCode,
        studentId,
        active,
      });

      // 특정 학생에게만 알림 전송
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

      return true;
    } catch (error) {
      this.logger.error({
        message: '코드 활성화 상태 알림 전송 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * 학생들에게 드론 활성화 상태 변경을 알립니다.
   * 강사가 드론 활성화를 토글할 때 호출됩니다.
   */
  async notifyDroneActiveChanged(
    lectureCode: string,
    studentId: string,
    active: boolean,
  ) {
    try {
      this.logger.log({
        message: '학생에게 드론 활성화 상태 변경 알림 전송',
        lectureCode,
        studentId,
        active,
      });

      // 특정 학생에게만 알림 전송
      const studentPersonalRoom = this.getStudentPersonalRoom(
        lectureCode,
        studentId,
      );
      this.server.to(studentPersonalRoom).emit('drone:activeChanged', {
        active,
        studentId,
        lectureCode,
        message: `드론 제어가 ${active ? '활성화' : '비활성화'}되었습니다.`,
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: '드론 활성화 상태 알림 전송 중 오류 발생',
        lectureCode,
        studentId,
        error: error.message,
      });
      return false;
    }
  }
}
