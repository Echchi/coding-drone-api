import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class RedisService {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.redisClient.on('connect', () => {
      console.log('✅ Redis 연결 성공!');
    });

    this.redisClient.on('error', (err) => {
      console.error('❌ Redis 연결 오류:', err);
    });
  }

  async saveStudent(lectureId: string, studentId: string, name: string) {
    const key = `lecture:${lectureId}:students`;
    await this.redisClient.hset(key, studentId, name);
  }

  async getStudents(lectureId: string) {
    const key = `lecture:${lectureId}:students`;
    return this.redisClient.hgetall(key);
  }

  async removeStudent(lectureId: string, studentId: string) {
    const key = `lecture:${lectureId}:students`;
    await this.redisClient.hdel(key, studentId);
  }

  async clearLectureData(lectureId: string) {
    const key = `lecture:${lectureId}:students`;
    await this.redisClient.del(key);
  }

  async saveStudentCode(lectureId: string, studentId: string, code: string) {
    const key = `lecture:${lectureId}:codes`;
    await this.redisClient.hset(key, studentId, code);
  }

  async getStudentCode(
    lectureId: string,
    studentId: string,
  ): Promise<string | null> {
    const key = `lecture:${lectureId}:codes`;
    return this.redisClient.hget(key, studentId);
  }

  async clearLectureCodes(lectureId: string) {
    const key = `lecture:${lectureId}:codes`;
    await this.redisClient.del(key);
  }

  // 드론 상태 저장
  async saveStudentDroneStatus(
    lectureId: string,
    studentId: string,
    status: string,
  ) {
    const key = `lecture:${lectureId}:droneStatus`;
    await this.redisClient.hset(key, studentId, status);
  }

  // 드론 상태 조회
  async getStudentDroneStatus(
    lectureId: string,
    studentId: string,
  ): Promise<string | null> {
    const key = `lecture:${lectureId}:droneStatus`;
    return this.redisClient.hget(key, studentId);
  }

  // 강의실의 모든 드론 상태 조회
  async getAllDroneStatus(lectureId: string) {
    const key = `lecture:${lectureId}:droneStatus`;
    return this.redisClient.hgetall(key);
  }

  // 강의실의 드론 상태 데이터 초기화
  async clearLectureDroneStatus(lectureId: string) {
    const key = `lecture:${lectureId}:droneStatus`;
    await this.redisClient.del(key);
  }

  // 학생 전체 정보 가져오기 (이름, 코드, 드론 상태)
  async getStudentsWithDetails(
    lectureId: string,
  ): Promise<
    Record<string, { name: string; code: string; droneStatus: string }>
  > {
    const studentsKey = `lecture:${lectureId}:students`;
    const codesKey = `lecture:${lectureId}:codes`;
    const droneStatusKey = `lecture:${lectureId}:droneStatus`;

    // 병렬로 데이터 가져오기
    const [students, codes, droneStatuses] = await Promise.all([
      this.redisClient.hgetall(studentsKey),
      this.redisClient.hgetall(codesKey),
      this.redisClient.hgetall(droneStatusKey),
    ]);

    // 결과 조합
    const result: Record<
      string,
      { name: string; code: string; droneStatus: string }
    > = {};

    // 학생 기본 정보로 초기화
    for (const [studentId, name] of Object.entries(students)) {
      result[studentId] = {
        name,
        code: '', // 기본값
        droneStatus: 'disconnected', // 기본값
      };
    }

    // 코드 정보 추가
    for (const [studentId, code] of Object.entries(codes)) {
      if (result[studentId]) {
        result[studentId].code = code;
      }
    }

    // 드론 상태 정보 추가
    for (const [studentId, status] of Object.entries(droneStatuses)) {
      if (result[studentId]) {
        result[studentId].droneStatus = status;
      }
    }

    return result;
  }
}
