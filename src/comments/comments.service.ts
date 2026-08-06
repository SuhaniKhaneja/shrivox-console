import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    ticketId: number,
    dto: CreateCommentDto,
  ) {
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

    return await this.prisma.comment.create({
      data: {
        message: dto.message,
        ticketId,
        createdById: userId,
      },
    });
  }

  async findAllForTicket(
    userId: number,
    ticketId: number,
  ) {
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

    return await this.prisma.comment.findMany({
      where: {
        ticketId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}