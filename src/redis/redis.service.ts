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
}
