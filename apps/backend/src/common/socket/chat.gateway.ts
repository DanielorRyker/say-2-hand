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
    origin: '*', // FE domain: http://localhost:3000
  },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  // key = conversationId, value = array userId đang mở conversation
 activeConversations: Record<string, string[]> = {};
  
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(` Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(` Client disconnected: ${client.id}`);
  }

  // Khi user mở cuộc trò chuyện cụ thể
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation_${data.conversationId}`;
    client.join(room);
    console.log(` Client ${client.id} joined ${room}`);
  }

  // Khi user đăng nhập / kết nối
  @SubscribeMessage('join_user')
  handleJoinUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `user_${data.userId}`;
    client.join(room);
    console.log(` Client ${client.id} joined ${room}`);
  }

  // Khi gửi tin nhắn mới
  @SubscribeMessage('send_message')
  handleMessage(
    @MessageBody()
    data: {
      conversationId: string;
      sender_id: string;
      receiverId: string;
      message: string;
      _id?: string;
      text:string;
      unreadIncrement: number;
    },
  ) {
    console.log('New message:', data);

    // Gửi tin nhắn đến những client đang trong phòng hội thoại đó
    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('receive_message', data);

    // Gửi event cập nhật hội thoại đến người nhận (nếu họ đang không mở phòng)
    this.server
      .to(`user_${data.receiverId}`)
      .emit('conversation_updated', {
        conversationId: data.conversationId,
        last_Message: data.message,
        text: data.text,
        sender_id: data.sender_id,
        unreadIncrement: data.unreadIncrement, 
        createdAt: new Date().toISOString(),
      });
  }




}

// key = conversationId, value = array userId đang mở conversation

