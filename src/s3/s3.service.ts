import { BadRequestException, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  constructor(private readonly configService: ConfigService) {}

  AWS_S3_BUCKET = this.configService.get('AWS_S3_BUCKET_NAME');
  s3 = new AWS.S3({
    accessKeyId: this.configService.get('AWS_S3_BUCKET_ACCESS_KEY'),
    secretAccessKey: this.configService.get('AWS_S3_BUCKET_SECRET_KEY'),
  });

  async uploadFile(file, keyPrefix: string = '') {
    if (!file || !file.buffer || !file.originalname || !file.mimetype) {
      throw new BadRequestException('Invalid file data');
    }

    const { originalname } = file;

    const key = `${keyPrefix}/${originalname}`;

    return await this.s3_upload(
      file.buffer,
      this.AWS_S3_BUCKET,
      key,
      file.mimetype,
    );
  }

  async s3_upload(file, bucket, key, mimetype) {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: this.configService.get('AWS_S3_BUCKET_REGION'),
      },
    };

    try {
      let s3Response = await this.s3.upload(params).promise();
      return s3Response;
    } catch (error) {
      throw new BadRequestException('Failed to upload file to S3');
    }
  }

  async deleteFileFromS3(key: string): Promise<void> {
    try {
      const params = {
        Bucket: this.AWS_S3_BUCKET,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw new BadRequestException('Failed to delete file from S3');
    }
  }
}
