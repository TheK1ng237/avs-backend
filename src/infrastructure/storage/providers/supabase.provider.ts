import { createClient } from '@supabase/supabase-js';
import { IStorageProvider } from '../storage.interface';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { logger } from '@/shared/utils/logger';
import 'dotenv/config';

function sanitizeFileName(originalName: string): string {
  const extension = path
    .extname(originalName)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '');
  const baseName = path
    .basename(originalName, path.extname(originalName))
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);

  return `${baseName || 'upload'}${extension}`;
}

export class SupabaseProvider implements IStorageProvider {
  private bucket: string;
  private client: ReturnType<typeof createClient>;

  constructor() {
    const url = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const bucket = process.env.STORAGE_BUCKET;

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase Storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
        throw new Error('SUPABASE_URL must use https.');
      }
    } catch (error) {
      throw new Error(
        `SUPABASE_URL is invalid: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!bucket) {
      throw new Error('STORAGE_BUCKET must be set when using Supabase Storage');
    }

    this.client = createClient(url, serviceRoleKey);
    this.bucket = bucket;
  }

  async upload(file: Express.Multer.File, folder?: string) {
    const fileName = `${uuid()}-${sanitizeFileName(file.originalname)}`;
    const path = folder ? `${folder}/${fileName}` : fileName;

    logger.info(
      `[SupabaseProvider] Starting upload - File: ${file.originalname}, Path: ${path}, Size: ${file.size} bytes`,
    );

    let uploadData;
    let uploadError;
    try {
      ({ data: uploadData, error: uploadError } = await this.client.storage
        .from(this.bucket)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
        }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Supabase Storage is unreachable. Verify SUPABASE_URL, network access and the bucket "${this.bucket}". (${message})`,
      );
    }

    if (uploadError) {
      logger.error(`[SupabaseProvider] Upload failed - Error: ${uploadError.message}`);
      throw uploadError;
    }

    logger.info(`[SupabaseProvider] Upload successful - Data: ${JSON.stringify(uploadData)}`);

    const { data: urlData } = this.client.storage.from(this.bucket).getPublicUrl(path);

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
    const { data, error } = await this.client.storage.from(this.bucket).download(key);

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
