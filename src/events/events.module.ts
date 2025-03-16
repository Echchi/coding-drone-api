import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsService } from './events.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // 네임스페이스 사용을 위한 설정
      wildcard: true,
      // 이벤트 전파 (버블링) 사용
      delimiter: '.',
      // 이벤트 제한 없음
      maxListeners: 0,
      // 비동기 이벤트 리스너 사용
      verboseMemoryLeak: true,
    }),
  ],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
