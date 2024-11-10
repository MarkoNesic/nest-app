import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadService } from './file-upload.service';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${uniqueSuffix}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    console.log('fajl', file);
    return 'File upload API';
  }
}

// {
//   console.log(file);
//   const res = await this.fileUploadService.upload(
//     file.originalname,
//     file.buffer,
//   );
// }

// new ParseFilePipe({
//   validators: [
//     new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
//     new FileTypeValidator({ fileType: 'image/png|image/jpeg' }),
//   ],
// }),
