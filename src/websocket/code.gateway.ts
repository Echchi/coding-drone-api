import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class CodeGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('sendCode')
  handleCode(
    @MessageBody()
    data: { lectureCode: string; studentId: string; code: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { lectureCode, studentId, code } = data;
    console.log(
      `Received code from ${studentId} in lecture ${lectureCode}:`,
      code,
    );

    // 같은 강의실에 있는 사람들에게만 코드 업데이트를 전송
    this.server.to(lectureCode).emit('updateCode', {
      studentId,
      code,
    });
  }
}
