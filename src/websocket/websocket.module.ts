import { Module } from '@nestjs/common';
import { WebSocketGatewayClass } from './websocket.gateway';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [WebSocketGatewayClass],
  exports: [WebSocketGatewayClass],
})
export class WebSocketModule {}
