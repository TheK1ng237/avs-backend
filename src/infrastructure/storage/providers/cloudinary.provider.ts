import cloudinary from 'cloudinary';
import { IStorageProvider, UploadResult } from '../storage.interface';
import 'dotenv/config'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export class CloudinaryProvider implements IStorageProvider {
  name = 'cloudinary';

  async upload(
    file: Express.Multer.File,
    folder: string = 'patterns'
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result) return reject(error);

          resolve({
            url: result.secure_url,
            key: result.public_id,
            provider: 'cloudinary',
          });
        }
      );

      stream.end(file.buffer);
    });
  }

  async delete(key: string): Promise<void> {
    await cloudinary.v2.uploader.destroy(key);
  }

  async download(key: string): Promise<Buffer> {
    const url = cloudinary.v2.url(key, {
      resource_type: 'auto',
    });

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download from Cloudinary: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}