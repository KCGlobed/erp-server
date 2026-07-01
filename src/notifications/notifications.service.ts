import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import type { AuthUser } from '../common/types/auth-user.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto, user: AuthUser) {
    return this.prisma.notification.create({
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type || 'INFO',
        isGlobal: dto.isGlobal || false,
        createdById: user.id,
        targetRoles: dto.targetRoles || [],
        cohorts: dto.cohortIds
          ? {
              create: dto.cohortIds.map((id) => ({ cohortId: id })),
            }
          : undefined,
        courses: dto.courseIds
          ? {
              create: dto.courseIds.map((id) => ({ courseId: id })),
            }
          : undefined,
      },
      include: {
        cohorts: true,
        courses: true,
      },
    });
  }

  async findAllForAdmin() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        cohorts: true,
        courses: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findMyNotifications(user: AuthUser) {
    // Determine the user's role names
    const userRoleNames = user.roles || [];

    // Get the user's cohort and enrolled courses
    const userData = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        cohort: true,
        enrollments: true,
      },
    });

    const cohortIds = userData?.cohort?.id ? [userData.cohort.id] : [];
    const courseIds =
      userData?.enrollments.map((e) => e.courseId) || [];

    // Find notifications that match any of the criteria
    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { targetRoles: { hasSome: userRoleNames } },
          { cohorts: { some: { cohortId: { in: cohortIds } } } },
          { courses: { some: { courseId: { in: courseIds } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reads: {
          where: { userId: user.id },
        },
      },
    });

    // Map the response to include `isRead`
    return notifications.map((notif) => {
      const isRead = notif.reads.length > 0;
      // We can delete the 'reads' array from the response if we don't need it
      const { reads, ...rest } = notif;
      return { ...rest, isRead };
    });
  }

  async markAsRead(notificationId: string, user: AuthUser) {
    // Check if notification exists
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Upsert read receipt
    await this.prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId: user.id,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        notificationId,
        userId: user.id,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async update(id: string, dto: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type,
        isGlobal: dto.isGlobal,
        targetRoles: dto.targetRoles,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
