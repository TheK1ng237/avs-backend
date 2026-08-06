import { S3 } from '@aws-sdk/client-s3';
import { IStorageProvider } from '../storage.interface';
import { v4 as uuid } from 'uuid';
import 'dotenv/config'

export class AwsProvider implements IStorageProvider {
  private s3 = new S3({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  private bucket = process.env.AWS_BUCKET!;

  async upload(file: Express.Multer.File) {
    const key = `${uuid()}-${file.originalname}`;

    await this.s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      url,
      key,
      provider: 'aws',
    };
  }

  async delete(key: string) {
    await this.s3.deleteObject({
      Bucket: this.bucket,
      Key: key,
    });
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.s3.getObject({
      Bucket: this.bucket,
      Key: key,
    });
    
    if (!response.Body) {
      throw new Error('No data returned from S3');
    }

    // Convert the stream to Buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}