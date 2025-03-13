import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { InstructorGateway } from './instructor.gateway';
import { StudentGateway } from './student.gateway';

@Module({
  imports: [RedisModule],
  providers: [InstructorGateway, StudentGateway],
  exports: [InstructorGateway, StudentGateway],
})
export class WebSocketModule {}
