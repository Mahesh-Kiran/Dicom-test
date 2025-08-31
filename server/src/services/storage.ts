import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  private readonly uploadsDir: string;
  private readonly tilesDir: string;
  private readonly maxFileSize: number = 500 * 1024 * 1024; // 500MB
  private readonly allowedTypes: string[] = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/tiff',
    'image/tif'
  ];

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    this.tilesDir = path.join(process.cwd(), 'data', 'tiles');
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.tilesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  public generateImageId(): string {
    return uuidv4();
  }

  public getUploadPath(imageId: string, originalName: string): string {
    const extension = path.extname(originalName);
    const safeName = this.sanitizeFilename(originalName);
    return path.join(this.uploadsDir, imageId, `original${extension}`);
  }

  public getTilesPath(imageId: string): string {
    return path.join(this.tilesDir, imageId);
  }

  public getDziPath(imageId: string): string {
    return path.join(this.tilesDir, imageId, `${imageId}.dzi`);
  }

  public getDziUrl(imageId: string): string {
    return `/tiles/${imageId}/${imageId}.dzi`;
  }

  public getTileUrl(imageId: string, level: number, x: number, y: number): string {
    return `/tiles/${imageId}/${level}/${x}_${y}.png`;
  }

  public validateFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  public async createImageDirectory(imageId: string): Promise<void> {
    const uploadDir = path.join(this.uploadsDir, imageId);
    const tilesDir = path.join(this.tilesDir, imageId);
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.mkdir(tilesDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directories for image ${imageId}: ${error}`);
    }
  }

  public async deleteImage(imageId: string): Promise<void> {
    const uploadDir = path.join(this.uploadsDir, imageId);
    const tilesDir = path.join(this.tilesDir, imageId);
    
    try {
      await fs.rm(uploadDir, { recursive: true, force: true });
      await fs.rm(tilesDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error deleting image ${imageId}:`, error);
    }
  }

  public async imageExists(imageId: string): Promise<boolean> {
    const uploadDir = path.join(this.uploadsDir, imageId);
    const tilesDir = path.join(this.tilesDir, imageId);
    
    try {
      const [uploadExists, tilesExist] = await Promise.all([
        fs.access(uploadDir).then(() => true).catch(() => false),
        fs.access(tilesDir).then(() => true).catch(() => false)
      ]);
      
      return uploadExists && tilesExist;
    } catch (error) {
      return false;
    }
  }

  public async getImageStats(imageId: string): Promise<{ uploadSize: number; tilesSize: number }> {
    const uploadDir = path.join(this.uploadsDir, imageId);
    const tilesDir = path.join(this.tilesDir, imageId);
    
    try {
      const [uploadSize, tilesSize] = await Promise.all([
        this.getDirectorySize(uploadDir),
        this.getDirectorySize(tilesDir)
      ]);
      
      return { uploadSize, tilesSize };
    } catch (error) {
      return { uploadSize: 0, tilesSize: 0 };
    }
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }
}

export const storageService = new StorageService();
