import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  namespace: '/ws/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.replace('Bearer ', '');
      const secret = this.configService.get<string>('JWT_SECRET');

      const payload = this.jwtService.verify(token, { secret });
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      const userId = payload.sub;

      // Fetch user details to get roles, courses, and cohort
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          cohort: true,
          enrollments: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Join Rooms
      // 1. User specific room (if we want to target a user directly later)
      client.join(`user_${userId}`);

      // 2. Role rooms
      user.roles.forEach((userRole) => {
        client.join(`role_${userRole.role.name}`);
      });

      // 3. Cohort room
      if (user.cohort) {
        client.join(`cohort_${user.cohort.id}`);
      }

      // 4. Course rooms
      user.enrollments.forEach((enrollment) => {
        client.join(`course_${enrollment.courseId}`);
      });

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.warn(`Connection rejected: ${client.id} - ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
