import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PriorityDto {
  @ApiProperty({
    example: 'Payment failed',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example:
      'My payment keeps failing every time I try to subscribe.',
  })
  @IsString()
  description: string;
}