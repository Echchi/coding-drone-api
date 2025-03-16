import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface StudentEventData {
  lectureCode: string;
  studentId: string;
  name?: string;
  code?: string;
  status?: string;
  students?: any[];
}

export interface AllStudentsEventData {
  lectureCode: string;
  active: boolean;
  students?: any[];
}

@Injectable()
export class EventsService {
  constructor(public readonly eventEmitter: EventEmitter2) {}

  // 학생 입장 이벤트
  emitStudentJoined(data: StudentEventData): boolean {
    return this.eventEmitter.emit('student.joined', data);
  }

  // 학생 퇴장 이벤트
  emitStudentLeft(data: StudentEventData): boolean {
    return this.eventEmitter.emit('student.left', data);
  }

  // 코드 업데이트 이벤트
  emitCodeUpdated(data: StudentEventData): boolean {
    return this.eventEmitter.emit('code.updated', data);
  }

  // 드론 상태 업데이트 이벤트
  emitDroneUpdated(data: StudentEventData): boolean {
    return this.eventEmitter.emit('drone.updated', data);
  }

  // 코드 활성화 상태 변경 이벤트
  emitCodeActiveChanged(data: StudentEventData & { active: boolean }): boolean {
    return this.eventEmitter.emit('code.active.changed', data);
  }

  // 드론 활성화 상태 변경 이벤트
  emitDroneActiveChanged(
    data: StudentEventData & { active: boolean },
  ): boolean {
    return this.eventEmitter.emit('drone.active.changed', data);
  }

  // 모든 학생 코드 활성화 상태 변경 이벤트
  emitAllCodeActiveChanged(data: AllStudentsEventData): boolean {
    return this.eventEmitter.emit('code.all.active.changed', data);
  }

  // 모든 학생 드론 활성화 상태 변경 이벤트
  emitAllDroneActiveChanged(data: AllStudentsEventData): boolean {
    return this.eventEmitter.emit('drone.all.active.changed', data);
  }
}
