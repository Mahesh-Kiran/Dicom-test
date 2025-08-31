export interface ImageUpload {
  id: string;
  originalName: string;
  originalPath: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export interface TileInfo {
  tileSize: number;
  levels: number;
  minLevel: number;
  maxLevel: number;
  dziPath: string;
}

export interface ImageManifest {
  id: string;
  width: number;
  height: number;
  dziUrl: string;
  tileInfo: TileInfo;
  createdAt: Date;
}

export interface UploadResponse {
  id: string;
  width: number;
  height: number;
  dziUrl: string;
  tileInfo: TileInfo;
  createdAt: Date;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export interface ProcessingProgress {
  stage: 'uploading' | 'processing' | 'tiling' | 'complete' | 'error';
  progress: number;
  message: string;
}

// File validation types
export interface FileValidation {
  isValid: boolean;
  error?: string;
  maxSize: number; // in bytes
  allowedTypes: string[];
}

// Sharp tiling options
export interface TilingOptions {
  tileSize: number;
  overlap: number;
  format: 'png' | 'jpg';
  quality: number;
  progressive: boolean;
}
