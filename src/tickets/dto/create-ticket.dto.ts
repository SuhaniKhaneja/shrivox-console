import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category, Priority } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Payment issue',
    description: 'Short title describing the issue',
  })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    example: 'My payment fails every time I try to subscribe.',
    description: 'Detailed description of the issue',
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional({
    enum: Priority,
    example: Priority.HIGH,
    description: 'Priority of the ticket',
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({
    enum: Category,
    example: Category.BILLING,
    description: 'Category of the ticket',
  })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;
}