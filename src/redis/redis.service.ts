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

  // 학생 전체 정보 가져오기 (이름, 코드, 드론 상태, 활성화 상태 포함)
  async getStudentsWithDetails(lectureId: string): Promise<
    Record<
      string,
      {
        name: string;
        code: string;
        droneStatus: string;
        codeActive: boolean;
        droneActive: boolean;
      }
    >
  > {
    const studentsKey = `lecture:${lectureId}:students`;
    const codesKey = `lecture:${lectureId}:codes`;
    const droneStatusKey = `lecture:${lectureId}:droneStatus`;
    const codeActiveKey = `lecture:${lectureId}:codeActive`;
    const droneActiveKey = `lecture:${lectureId}:droneActive`;

    // 병렬로 데이터 가져오기
    const [students, codes, droneStatuses, codeActive, droneActive] =
      await Promise.all([
        this.redisClient.hgetall(studentsKey),
        this.redisClient.hgetall(codesKey),
        this.redisClient.hgetall(droneStatusKey),
        this.redisClient.hgetall(codeActiveKey),
        this.redisClient.hgetall(droneActiveKey),
      ]);

    // 결과 조합
    const result: Record<
      string,
      {
        name: string;
        code: string;
        droneStatus: string;
        codeActive: boolean;
        droneActive: boolean;
      }
    > = {};

    // 학생 기본 정보로 초기화
    for (const [studentId, name] of Object.entries(students)) {
      result[studentId] = {
        name,
        code: '', // 기본값
        droneStatus: 'disconnected', // 기본값
        codeActive: true, // 기본값
        droneActive: true, // 기본값
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

    // 코드 활성화 상태 정보 추가
    for (const [studentId, active] of Object.entries(codeActive)) {
      if (result[studentId]) {
        result[studentId].codeActive = active === 'true';
      }
    }

    // 드론 활성화 상태 정보 추가
    for (const [studentId, active] of Object.entries(droneActive)) {
      if (result[studentId]) {
        result[studentId].droneActive = active === 'true';
      }
    }

    return result;
  }

  // 학생 코드 활성화 상태 저장
  async saveStudentCodeActive(
    lectureId: string,
    studentId: string,
    active: boolean,
  ) {
    const key = `lecture:${lectureId}:codeActive`;
    await this.redisClient.hset(key, studentId, active ? 'true' : 'false');
  }

  // 학생 코드 활성화 상태 조회
  async getStudentCodeActive(
    lectureId: string,
    studentId: string,
  ): Promise<boolean> {
    const key = `lecture:${lectureId}:codeActive`;
    const value = await this.redisClient.hget(key, studentId);
    // 값이 없으면 기본적으로 true (활성화)
    return value === null ? true : value === 'true';
  }

  // 강의의 모든 학생 코드 활성화 상태 조회
  async getAllCodeActive(lectureId: string): Promise<Record<string, boolean>> {
    const key = `lecture:${lectureId}:codeActive`;
    const result = await this.redisClient.hgetall(key);

    // 문자열 "true"/"false"를 실제 boolean으로 변환
    const convertedResult: Record<string, boolean> = {};
    Object.keys(result).forEach((studentId) => {
      convertedResult[studentId] = result[studentId] === 'true';
    });

    return convertedResult;
  }

  // 강의의 모든 학생 코드 활성화 상태 설정
  async setAllCodeActive(lectureId: string, active: boolean) {
    const studentsKey = `lecture:${lectureId}:students`;
    const codeActiveKey = `lecture:${lectureId}:codeActive`;

    // 모든 학생 목록 가져오기
    const students = await this.redisClient.hgetall(studentsKey);

    // 파이프라인 생성
    const pipeline = this.redisClient.pipeline();

    // 모든 학생의 코드 활성화 상태 설정
    Object.keys(students).forEach((studentId) => {
      pipeline.hset(codeActiveKey, studentId, active ? 'true' : 'false');
    });

    // 파이프라인 실행
    await pipeline.exec();
  }

  // 학생 드론 활성화 상태 저장
  async saveStudentDroneActive(
    lectureId: string,
    studentId: string,
    active: boolean,
  ) {
    const key = `lecture:${lectureId}:droneActive`;
    await this.redisClient.hset(key, studentId, active ? 'true' : 'false');
  }

  // 학생 드론 활성화 상태 조회
  async getStudentDroneActive(
    lectureId: string,
    studentId: string,
  ): Promise<boolean> {
    const key = `lecture:${lectureId}:droneActive`;
    const value = await this.redisClient.hget(key, studentId);
    // 값이 없으면 기본적으로 true (활성화)
    return value === null ? true : value === 'true';
  }

  // 강의의 모든 학생 드론 활성화 상태 조회
  async getAllDroneActive(lectureId: string): Promise<Record<string, boolean>> {
    const key = `lecture:${lectureId}:droneActive`;
    const result = await this.redisClient.hgetall(key);

    // 문자열 "true"/"false"를 실제 boolean으로 변환
    const convertedResult: Record<string, boolean> = {};
    Object.keys(result).forEach((studentId) => {
      convertedResult[studentId] = result[studentId] === 'true';
    });

    return convertedResult;
  }

  // 강의의 모든 학생 드론 활성화 상태 설정
  async setAllDroneActive(lectureId: string, active: boolean) {
    const studentsKey = `lecture:${lectureId}:students`;
    const droneActiveKey = `lecture:${lectureId}:droneActive`;

    // 모든 학생 목록 가져오기
    const students = await this.redisClient.hgetall(studentsKey);

    // 파이프라인 생성
    const pipeline = this.redisClient.pipeline();

    // 모든 학생의 드론 활성화 상태 설정
    Object.keys(students).forEach((studentId) => {
      pipeline.hset(droneActiveKey, studentId, active ? 'true' : 'false');
    });

    // 파이프라인 실행
    await pipeline.exec();
  }

  // 강의실의 활성화 상태 데이터 초기화
  async clearLectureActiveStatus(lectureId: string) {
    const codeActiveKey = `lecture:${lectureId}:codeActive`;
    const droneActiveKey = `lecture:${lectureId}:droneActive`;

    await this.redisClient.del(codeActiveKey);
    await this.redisClient.del(droneActiveKey);
  }
}
