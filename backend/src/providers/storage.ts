import fs from 'fs';
import path from 'path';
import { config } from '../config';

// Interface for future AWS S3 replacement
export interface StorageProvider {
  upload(fileBuffer: Buffer, fileName: string): Promise<string>;
  download(fileName: string): Promise<Buffer>;
  delete(fileName: string): Promise<void>;
  getFilePath(fileName: string): string;
}

// Current implementation: Local file storage
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = config.uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(fileBuffer: Buffer, fileName: string): Promise<string> {
    const filePath = path.join(this.uploadDir, fileName);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, fileBuffer);
    return fileName;
  }

  async download(fileName: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    return fs.readFileSync(filePath);
  }

  async delete(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getFilePath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }
}

// Singleton instance
export const storageProvider: StorageProvider = new LocalStorageProvider();
