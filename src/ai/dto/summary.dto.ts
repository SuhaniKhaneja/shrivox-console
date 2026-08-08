import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SummaryDto {
  @ApiProperty({ example: 'Payment keeps failing' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'My card is declined every time I try to subscribe.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'User tried twice. Payment continues to fail.',
  })
  @IsString()
  comments: string;
}
