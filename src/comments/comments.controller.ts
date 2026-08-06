import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('tickets/:ticketId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Request() req,
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      req.user.userId,
      ticketId,
      dto,
    );
  }

  @Get()
  findAll(
    @Request() req,
    @Param('ticketId', ParseIntPipe) ticketId: number,
  ) {
    return this.commentsService.findAllForTicket(
      req.user.userId,
      ticketId,
    );
  }
}