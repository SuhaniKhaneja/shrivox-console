import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category, Priority, Status } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    example: 'Updated payment issue',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({
    example: 'The payment now fails with a timeout error.',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({
    enum: Status,
    example: Status.RESOLVED,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({
    enum: Priority,
    example: Priority.URGENT,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({
    enum: Category,
    example: Category.BILLING,
  })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;
}