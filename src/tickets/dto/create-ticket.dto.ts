import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { Category, Priority } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(Category)
  category?: Category;
}