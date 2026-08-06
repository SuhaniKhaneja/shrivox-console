import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query() query: QueryTicketDto,
  ) {
    return this.ticketsService.findAllForUser(
      req.user.userId,
      query,
    );
  }

  @Get(':id')
  findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ticketsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(
      req.user.userId,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ticketsService.remove(
      req.user.userId,
      id,
    );
  }
}