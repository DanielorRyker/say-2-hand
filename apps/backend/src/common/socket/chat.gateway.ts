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
  // key = userId, value = socketId
  onlineUsers: Record<string, string> = {};

  @WebSocketServer()
  server: Server;

  // Khi client kết nối socket
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // Không làm gì ở đây, chờ join_user để xác định userId
  }

  // Khi client disconnect
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Tìm userId tương ứng với socketId này
    const userId = Object.keys(this.onlineUsers).find(
      (id) => this.onlineUsers[id] === client.id,
    );
    if (userId) {
      // Xóa khỏi danh sách online
      delete this.onlineUsers[userId];
      // Emit cho tất cả client biết user này offline
      this.server.emit('user_offline', { userId });
    }
    // Xử lý rời khỏi các conversation nếu cần
    Object.keys(this.activeConversations).forEach((convId) => {
      this.activeConversations[convId] = this.activeConversations[
        convId
      ].filter((uid) => uid !== userId);
    });
  }

  // Khi user join vào hệ thống (sau khi login FE sẽ emit join_user)
  @SubscribeMessage('join_user')
  handleJoinUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    // Lưu trạng thái online
    this.onlineUsers[userId] = client.id;
    // Join vào room riêng của user
    client.join(`user_${userId}`);
    // Emit cho tất cả client biết user này online
    this.server.emit('user_online', { userId });
    // Gửi về cho client danh sách user đang online (FE có thể dùng để hiển thị)
    client.emit('online_users', { userIds: Object.keys(this.onlineUsers) });
    console.log(`Client ${client.id} joined user_${userId}`);
    return { success: true };
  }

  // Khi user mở cuộc trò chuyện cụ thể
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId, userId } = data;
    const room = `conversation_${conversationId}`;
    client.join(room);
    if (!this.activeConversations[conversationId]) {
      this.activeConversations[conversationId] = [];
    }
    if (!this.activeConversations[conversationId].includes(userId)) {
      this.activeConversations[conversationId].push(userId);
    }
    // Gửi về danh sách user đang online trong conversation này
    const onlineInConv = this.activeConversations[conversationId].filter(
      (uid) => !!this.onlineUsers[uid],
    );
    this.server.to(room).emit('conversation_online_users', {
      conversationId,
      userIds: onlineInConv,
    });
    console.log(`Client ${client.id} joined ${room}`);
    return { success: true };
  }

  // Khi gửi tin nhắn mới (text, ảnh, video)
  @SubscribeMessage('send_message')
  handleMessage(
    @MessageBody()
    data: {
      conversationId: string;
      sender_id: string;
      receiverId: string;
      type: 'text' | 'image' | 'file' | 'video';
      text?: string;
      attachments?: string[];
      _id?: string;
      unreadIncrement: number;
      created_at?: string;
    },
  ) {
    console.log('New message:', data);

    // Emit message mới tới tất cả client trong phòng hội thoại
    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('receive_message', {
        _id: data._id,
        conversation_id: data.conversationId,
        sender_id: data.sender_id,
        type: data.type,
        text: data.text,
        attachments: data.attachments,
        created_at: data.created_at || new Date().toISOString(),
      });

    // Gửi event cập nhật hội thoại đến người nhận (nếu họ đang không mở phòng)
    this.server.to(`user_${data.receiverId}`).emit('conversation_updated', {
      conversationId: data.conversationId,
      last_Message: data.text || (data.attachments && data.attachments.length > 0 ? `[${data.type}]` : ''),
      type: data.type,
      sender_id: data.sender_id,
      unreadIncrement: data.unreadIncrement,
      createdAt: data.created_at || new Date().toISOString(),
    });
  }

  // Hàm tiện ích: kiểm tra user có online không
  isUserOnline(userId: string): boolean {
    return !!this.onlineUsers[userId];
  }
}

// key = conversationId, value = array userId đang mở conversation
