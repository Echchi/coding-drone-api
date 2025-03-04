import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class WebSocketGatewayClass {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('sendCode')
  handleCode(
    @MessageBody() data: { studentId: string; code: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Received code from ${data.studentId}:`, data.code);
    this.server.emit('updateCode', {
      studentId: data.studentId,
      code: data.code,
    });
  }
}
