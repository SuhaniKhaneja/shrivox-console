import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateTicketDto) {
    return await this.prisma.ticket.create({
      data: {
        ...dto,
        createdById: userId,
      },
    });
  }

  async findAllForUser(userId: number) {
    return await this.prisma.ticket.findMany({
      where: {
        createdById: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: number, ticketId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.createdById !== userId) {
      throw new ForbiddenException(
        'You do not have access to this ticket',
      );
    }

    return ticket;
  }
}