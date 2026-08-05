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
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.ticketsService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ticketsService.findOne(req.user.userId, id);
  }
}