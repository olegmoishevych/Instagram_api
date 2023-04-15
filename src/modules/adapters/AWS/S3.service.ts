import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { UploadFileCommand } from '../../users/use-cases/upload-file.use-case';

@Injectable()
export class S3Service {
  constructor(private configService: ConfigService) {}

  bucketName = this.configService.get('inctagram-nest');
  s3 = new S3({
    accessKeyId: this.configService.get('ACCESS_ID'),
    secretAccessKey: this.configService.get('AWS_SECRET_KEY'),
  });

  async uploadFile(file: Express.Multer.File | UploadFileCommand) {
    try {
      const uploadResult = await this.s3
        .upload({
          Bucket: this.bucketName,
          Body: file.buffer,
          Key: `${uuid() + file.originalname}`,
          ACL: 'public-read',
          ContentDisposition: 'Inline',
          ContentType: file.mimetype,
        })
        .promise();
      console.log('uploadResult', uploadResult);
      return uploadResult;
    } catch (e) {
      console.log(e);
    }
  }
}
