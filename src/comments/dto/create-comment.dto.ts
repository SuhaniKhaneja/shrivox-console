import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'We are currently investigating this issue.',
    description: 'Comment message',
  })
  @IsString()
  @MinLength(1)
  message: string;
}