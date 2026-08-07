import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { AttachmentsService } from './attachments.service';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId/attachments')
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadAttachmentDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const unique =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9);

          cb(
            null,
            unique + extname(file.originalname),
          );
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_, file, cb) => {
        const allowed = [
          'image/png',
          'image/jpeg',
          'application/pdf',
          'text/plain',
        ];

        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Unsupported file type',
            ),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  upload(
    @Request() req,
    @Param('ticketId', ParseIntPipe)
    ticketId: number,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.attachmentsService.upload(
      req.user.userId,
      ticketId,
      file,
    );
  }

  @Get()
  findAll(
    @Request() req,
    @Param('ticketId', ParseIntPipe)
    ticketId: number,
  ) {
    return this.attachmentsService.findAll(
      req.user.userId,
      ticketId,
    );
  }

  @Get(':attachmentId')
  async download(
    @Request() req,
    @Param('ticketId', ParseIntPipe)
    ticketId: number,
    @Param('attachmentId', ParseIntPipe)
    attachmentId: number,
    @Res() res: Response,
  ) {
    const attachment =
      await this.attachmentsService.findOne(
        req.user.userId,
        ticketId,
        attachmentId,
      );

    return res.download(
      attachment.path,
      attachment.filename,
    );
  }

  @Delete(':attachmentId')
  remove(
    @Request() req,
    @Param('ticketId', ParseIntPipe)
    ticketId: number,
    @Param('attachmentId', ParseIntPipe)
    attachmentId: number,
  ) {
    return this.attachmentsService.remove(
      req.user.userId,
      ticketId,
      attachmentId,
    );
  }
}