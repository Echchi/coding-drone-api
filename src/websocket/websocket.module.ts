import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { InstructorGateway } from './instructor.gateway';
import { StudentGateway } from './student.gateway';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [RedisModule, EventsModule],
  providers: [InstructorGateway, StudentGateway],
  exports: [InstructorGateway, StudentGateway],
})
export class WebSocketModule {}
