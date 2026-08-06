import { createClient } from '@supabase/supabase-js';
import { IStorageProvider } from '../storage.interface';
import { v4 as uuid } from 'uuid';
import { logger } from '@/shared/utils/logger';
import 'dotenv/config'

export class SupabaseProvider implements IStorageProvider {
  private client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ); 

  private bucket = 'patterns';

  async upload(file: Express.Multer.File, folder?: string) {
    const fileName = `${uuid()}-${file.originalname}`;
    const path = folder ? `${folder}/${fileName}` : fileName;
    
    logger.info(`[SupabaseProvider] Starting upload - File: ${file.originalname}, Path: ${path}, Size: ${file.size} bytes`);
    
    const { data: uploadData, error: uploadError } = await this.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      logger.error(`[SupabaseProvider] Upload failed - Error: ${uploadError.message}`);
      throw uploadError;
    }

    logger.info(`[SupabaseProvider] Upload successful - Data: ${JSON.stringify(uploadData)}`);

    const { data: urlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(path);

    logger.info(`[SupabaseProvider] Public URL generated - URL: ${urlData.publicUrl}`);

    return {
      url: urlData.publicUrl,
      key: path,
      provider: 'supabase',
    };
  }

  async delete(key: string) {
    await this.client.storage.from(this.bucket).remove([key]);
  }

  async download(key: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(key);

    if (error) {
      logger.error(`[SupabaseProvider] Download failed - Error: ${error.message}`);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from Supabase');
    }

    // Convert the Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}