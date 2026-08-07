import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PromptDto {
  @ApiProperty({
    example: 'Say hello',
  })
  @IsString()
  prompt: string;
}