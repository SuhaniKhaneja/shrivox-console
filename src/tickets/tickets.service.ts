import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

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

  async update(
    userId: number,
    ticketId: number,
    dto: UpdateTicketDto,
  ) {
    // Ensure the ticket exists and belongs to the logged-in user
    await this.findOne(userId, ticketId);

    return await this.prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: dto,
    });
  }

  async remove(userId: number, ticketId: number) {
    // Ensure the ticket exists and belongs to the logged-in user
    await this.findOne(userId, ticketId);

    await this.prisma.ticket.delete({
      where: {
        id: ticketId,
      },
    });

    return {
      message: 'Ticket deleted successfully',
    };
  }
}