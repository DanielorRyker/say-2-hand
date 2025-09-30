import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // FE (Next.js) domain, vd: http://localhost:3000
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Client join vào room theo conversationId
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation_${data.conversationId}`);
    console.log(
      `Client ${client.id} joined room conversation_${data.conversationId}`,
    );
  }


@SubscribeMessage('send_message')
handleMessage(
  @MessageBody() data: { conversationId: string; user: string; message: string; _id?: string },
) {
     console.log('New message:', data);
  this.server.to(`conversation_${data.conversationId}`).emit('receive_message', data);
}
}
