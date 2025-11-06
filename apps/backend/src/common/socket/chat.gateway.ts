import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Task 35-37: WebSocket Security - Rate limiting per connection
class WebSocketRateLimiter {
  private messageCount: Map<string, { count: number; resetTime: number }> =
    new Map();
  private readonly maxMessages = 10; // Max messages per window
  private readonly windowMs = 1000; // 1 second window

  checkLimit(clientId: string): boolean {
    const now = Date.now();
    const record = this.messageCount.get(clientId);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.messageCount.set(clientId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxMessages) {
      return false; // Rate limit exceeded
    }

    record.count++;
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [clientId, record] of this.messageCount.entries()) {
      if (now > record.resetTime) {
        this.messageCount.delete(clientId);
      }
    }
  }
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true,
  },
  // Task 35: WebSocket security configurations
  transports: ['websocket', 'polling'], // Prefer websocket for security
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB max message size
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly rateLimiter = new WebSocketRateLimiter();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private jwtService: JwtService) {
    // Cleanup rate limiter every 10 seconds
    this.cleanupInterval = setInterval(() => {
      this.rateLimiter.cleanup();
    }, 10000);
  }

  // key = conversationId, value = array userId đang mở conversation
  activeConversations: Record<string, string[]> = {};

  @WebSocketServer()
  server: Server;

  // Task 35: Validate WebSocket connection với JWT
  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const authHeader = client.handshake.headers.authorization;
      const token =
        (client.handshake.auth.token as string) ||
        (typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined);

      if (!token) {
        this.logger.warn(`Connection rejected - No token: ${client.id}`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);

      // Attach user info to socket
      (client as any).userId = payload.sub || payload.userId;

      this.logger.log(
        `Client connected: ${client.id} (User: ${(client as any).userId})`,
      );
    } catch (error) {
      this.logger.error(
        `Connection rejected - Invalid token: ${client.id}`,
        error.message,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);

    // Cleanup user from active conversations
    for (const conversationId in this.activeConversations) {
      this.activeConversations[conversationId] = this.activeConversations[
        conversationId
      ].filter((id) => id !== userId);
    }
  }

  // Task 36-37: Rate limiting cho WebSocket messages
  private checkRateLimit(client: Socket, eventName: string): boolean {
    if (!this.rateLimiter.checkLimit(client.id)) {
      this.logger.warn(`Rate limit exceeded for ${client.id} on ${eventName}`);
      client.emit('error', {
        message: 'Too many requests. Please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return false;
    }
    return true;
  }

  // Khi user mở cuộc trò chuyện cụ thể
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Task 37: Apply rate limiting
    if (!this.checkRateLimit(client, 'join_conversation')) {
      return;
    }

    const room = `conversation_${data.conversationId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
  }

  // Khi user đăng nhập / kết nối
  @SubscribeMessage('join_user')
  async handleJoinUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Task 37: Apply rate limiting
    if (!this.checkRateLimit(client, 'join_user')) {
      return;
    }

    // Verify authenticated user can only join their own room
    const authenticatedUserId = (client as any).userId;
    if (!authenticatedUserId || authenticatedUserId !== data.userId) {
      client.emit('error', {
        message: "Cannot join another user's room",
        code: 'FORBIDDEN',
      });
      return;
    }

    const room = `user_${data.userId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
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
      text: string;
      unreadIncrement: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Task 37: Apply rate limiting
    if (!this.checkRateLimit(client, 'send_message')) {
      return;
    }

    // Task 37: Validate message content
    if (!data.message || typeof data.message !== 'string') {
      client.emit('error', {
        message: 'Invalid message content',
        code: 'INVALID_MESSAGE',
      });
      return;
    }

    // Sanitize và validate
    const sanitizedMessage = data.message.trim();
    if (sanitizedMessage.length === 0) {
      client.emit('error', {
        message: 'Message cannot be empty',
        code: 'EMPTY_MESSAGE',
      });
      return;
    }

    if (sanitizedMessage.length > 5000) {
      client.emit('error', {
        message: 'Message too long (max 5000 characters)',
        code: 'MESSAGE_TOO_LONG',
      });
      return;
    }

    // Validate text field
    const sanitizedText = data.text?.trim() || '';

    // Verify authenticated user
    const userId = (client as any).userId;
    if (!userId || userId !== data.sender_id) {
      client.emit('error', {
        message: 'Unauthorized sender',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    this.logger.debug('New message received', {
      conversationId: data.conversationId,
    });

    // Gửi tin nhắn đến những client đang trong phòng hội thoại đó
    this.server
      .to(`conversation_${data.conversationId}`)
      .emit('receive_message', {
        ...data,
        message: sanitizedMessage,
        text: sanitizedText,
      });

    // Gửi event cập nhật hội thoại đến người nhận (nếu họ đang không mở phòng)
    this.server.to(`user_${data.receiverId}`).emit('conversation_updated', {
      conversationId: data.conversationId,
      last_Message: sanitizedMessage,
      text: sanitizedText,
      sender_id: data.sender_id,
      unreadIncrement: data.unreadIncrement,
      createdAt: new Date().toISOString(),
    });
  }
}

// key = conversationId, value = array userId đang mở conversation
