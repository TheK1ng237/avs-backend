import { IStorageProvider, UploadResult } from './storage.interface';
import { logger } from '@/shared/utils/logger';

export class StorageService {
  constructor(private providers: IStorageProvider[]) {}

  async upload(file: Express.Multer.File, folder?: string): Promise<UploadResult> {
    logger.info(`[StorageService] Upload started - File: ${file.originalname}, Folder: ${folder || 'root'}, Size: ${file.size} bytes`);
    let lastError: any;

    for (const provider of this.providers) {
      try {
        logger.info(`[StorageService] Trying provider: ${provider.constructor.name}`);
        const result = await provider.upload(file, folder);
        logger.info(`[StorageService] Upload SUCCESS via ${provider.constructor.name} - URL: ${result.url}`);
        return result;
      } catch (err) {
        lastError = err;
        logger.error(`[StorageService] Provider failed: ${provider.constructor.name} - ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    throw new Error(`All storage providers failed: ${lastError?.message}`);
  }

  async delete(key: string): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.delete(key);
        return;
      } catch (err) {
        console.warn(`[Storage delete failed]:`, provider.constructor.name);
      }
    }
  }

  async download(key: string): Promise<Buffer> {
    let lastError: any;

    for (const provider of this.providers) {
      try {
        logger.info(`[StorageService] Trying provider for download: ${provider.constructor.name}`);
        const result = await provider.download(key);
        logger.info(`[StorageService] Download SUCCESS via ${provider.constructor.name}`);
        return result;
      } catch (err) {
        lastError = err;
        logger.error(`[StorageService] Provider download failed: ${provider.constructor.name} - ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    throw new Error(`All storage providers failed for download: ${lastError?.message}`);
  }
}