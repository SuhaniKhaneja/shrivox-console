import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(
    userId: number,
    dto: CreateTicketDto,
  ) {
    const category = await this.aiService.categorize(
      dto.title,
      dto.description,
    );

    const priority = await this.aiService.predictPriority(
      dto.title,
      dto.description,
    );

    return await this.prisma.ticket.create({
      data: {
        ...dto,
        category,
        priority,
        createdById: userId,
      },
    });
  }

  async findAllForUser(
    userId: number,
    query: QueryTicketDto,
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const where = {
      createdById: userId,

      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),

      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
      }),

      this.prisma.ticket.count({
        where,
      }),
    ]);

    return {
      data: tickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    userId: number,
    ticketId: number,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(
        'Ticket not found',
      );
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
    await this.findOne(userId, ticketId);

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: dto,
    });
  }

  async remove(
    userId: number,
    ticketId: number,
  ) {
    await this.findOne(userId, ticketId);

    await this.prisma.ticket.delete({
      where: { id: ticketId },
    });

    return {
      message: 'Ticket deleted successfully',
    };
  }
}