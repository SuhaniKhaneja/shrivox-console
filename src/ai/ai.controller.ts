import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AiService } from './ai.service';
import { PromptDto } from './dto/prompt.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('test')
  @ApiOperation({
    summary: 'Test Gemini AI',
  })
  async test(@Body() dto: PromptDto) {
    return this.aiService.test(dto.prompt);
  }
}