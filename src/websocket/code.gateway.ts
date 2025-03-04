import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'code' })
export class CodeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly redisService: RedisService) {}
}
