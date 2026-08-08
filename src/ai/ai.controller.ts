import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AiService } from './ai.service';
import { CategorizeTicketDto } from './dto/categorize-ticket.dto';
import { PriorityDto } from './dto/priority.dto';
import { SummaryDto } from './dto/summary.dto';
import { ReplyDto } from './dto/reply.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
  ) {}

  @Post('categorize')
  @ApiOperation({
    summary: 'Categorize a support ticket using AI',
  })
  async categorize(
    @Body() dto: CategorizeTicketDto,
  ) {
    return {
      category: await this.aiService.categorize(
        dto.title,
        dto.description,
      ),
    };
  }

  @Post('priority')
  @ApiOperation({
    summary: 'Predict ticket priority using AI',
  })
  async priority(
    @Body() dto: PriorityDto,
  ) {
    return {
      priority: await this.aiService.predictPriority(
        dto.title,
        dto.description,
      ),
    };
  }

  @Post('summary')
  @ApiOperation({
    summary: 'Generate an AI ticket summary',
  })
  async summary(
    @Body() dto: SummaryDto,
  ) {
    return {
      summary: await this.aiService.summarize(
        dto.title,
        dto.description,
        dto.comments,
      ),
    };
  }

  @Post('reply')
  @ApiOperation({
    summary: 'Generate an AI support reply',
  })
  async reply(
    @Body() dto: ReplyDto,
  ) {
    return {
      reply: await this.aiService.generateReply(
        dto.title,
        dto.description,
        dto.comments,
      ),
    };
  }
}