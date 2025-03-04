import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { LectureGateway } from './lecture.gateway';
import { CodeGateway } from './code.gateway';

@Module({
  imports: [RedisModule],
  providers: [LectureGateway, CodeGateway],
  exports: [LectureGateway, CodeGateway],
})
export class WebSocketModule {}
