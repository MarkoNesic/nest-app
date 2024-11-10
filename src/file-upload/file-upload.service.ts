import { Injectable } from '@nestjs/common';
// import { UpdateFileUploadDto } from './dto/update-file-upload.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadService {
  constructor(private readonly configService: ConfigService) {}

  // async upload(fileName: string, file: Buffer) {}
}
