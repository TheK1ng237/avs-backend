export interface UploadResult {
  url: string;
  key: string;
  provider: string;
}

export interface IStorageProvider {
  upload(file: Express.Multer.File, folder?: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  download(key: string): Promise<Buffer>;
}