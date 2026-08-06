import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Priority, Status } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: number) {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      recentTickets,
    ] = await Promise.all([
      this.prisma.ticket.count({
        where: { createdById: userId },
      }),

      this.prisma.ticket.count({
        where: {
          createdById: userId,
          status: Status.OPEN,
        },
      }),

      this.prisma.ticket.count({
        where: {
          createdById: userId,
          status: Status.IN_PROGRESS,
        },
      }),

      this.prisma.ticket.count({
        where: {
          createdById: userId,
          status: Status.RESOLVED,
        },
      }),

      this.prisma.ticket.count({
        where: {
          createdById: userId,
          status: Status.CLOSED,
        },
      }),

      this.prisma.ticket.count({
        where: {
          createdById: userId,
          priority: Priority.URGENT,
        },
      }),

      this.prisma.ticket.findMany({
        where: {
          createdById: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      recentTickets,
    };
  }
}