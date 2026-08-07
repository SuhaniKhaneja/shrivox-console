import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(userId: number, ticketId: number, file: Express.Multer.File) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.createdById !== userId)
      throw new ForbiddenException('Access denied');

    return this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        ticketId,
        uploadedById: userId,
      },
    });
  }

  async findAll(userId: number, ticketId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.createdById !== userId)
      throw new ForbiddenException('Access denied');

    return this.prisma.attachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: number, ticketId: number, attachmentId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.createdById !== userId)
      throw new ForbiddenException('Access denied');

    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment)
      throw new NotFoundException('Attachment not found');

    return attachment;
  }

  async remove(userId: number, ticketId: number, attachmentId: number) {
    const attachment = await this.findOne(
      userId,
      ticketId,
      attachmentId,
    );

    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return {
      message: 'Attachment deleted successfully',
    };
  }
}