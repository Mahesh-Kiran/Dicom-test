import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { TileInfo, TilingOptions } from '../types';
import { storageService } from './storage';

export class TilerService {
  private readonly defaultOptions: TilingOptions = {
    tileSize: 512,
    overlap: 1,
    format: 'png',
    quality: 90,
    progressive: false
  };

  public async createTiles(
    imagePath: string,
    imageId: string,
    options: Partial<TilingOptions> = {}
  ): Promise<TileInfo> {
    const tilingOptions = { ...this.defaultOptions, ...options };
    
    // Get image metadata first to adjust tile size for small images
    const metadata = await sharp(imagePath).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: missing width or height');
    }
    
    // Adjust tile size for small images
    const maxDimension = Math.max(metadata.width, metadata.height);
    if (maxDimension < tilingOptions.tileSize) {
      tilingOptions.tileSize = Math.min(256, maxDimension);
      console.log(`📏 Adjusted tile size to ${tilingOptions.tileSize} for small image (${metadata.width}x${metadata.height})`);
    }
    
    const tilesPath = storageService.getTilesPath(imageId);
    const dziPath = storageService.getDziPath(imageId);

    try {
      console.log(`📊 Image metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      // Ensure tiles directory exists
      await fs.mkdir(tilesPath, { recursive: true });
      console.log('📁 Tiles directory created/verified:', tilesPath);

      // Create tiles using Sharp's tile method with DZI layout
      console.log('🔧 Creating tiles with Sharp DZI layout...');
      
      // Use Sharp's tile generation but create our own DZI file
      await sharp(imagePath)
        .png({ 
          quality: tilingOptions.quality, 
          progressive: tilingOptions.progressive 
        })
        .tile({
          size: tilingOptions.tileSize,
          layout: 'dz',
          overlap: tilingOptions.overlap,
          container: 'fs'
        })
        .toFile(path.join(tilesPath, imageId));

      // Create a proper DZI file for OpenSeaDragon
      await this.createOpenSeadragonDzi(imageId, metadata.width, metadata.height, tilingOptions);

      console.log('✅ Sharp tiling completed');

      // Verify DZI file was created
      const dziExists = await fs.access(dziPath).then(() => true).catch(() => false);
      if (!dziExists) {
        throw new Error(`DZI file not created at expected path: ${dziPath}`);
      }

      console.log('✅ DZI file verified:', dziPath);

      // Check what files were actually created
      console.log('🔍 Checking created files...');
      const files = await fs.readdir(tilesPath, { withFileTypes: true });
      console.log('📂 Created files/dirs:', files.map(f => ({ name: f.name, isDirectory: f.isDirectory() })));

      // Read the DZI file to get actual tile information
      const dziContent = await fs.readFile(dziPath, 'utf8');
      console.log('📄 DZI content preview:', dziContent.substring(0, 200) + '...');

      // Parse our custom DZI XML to get actual dimensions and tile info
      const widthMatch = dziContent.match(/Width="(\d+)"/);
      const heightMatch = dziContent.match(/Height="(\d+)"/);
      const tileSizeMatch = dziContent.match(/TileSize="(\d+)"/);
      const overlapMatch = dziContent.match(/Overlap="(\d+)"/);

      if (!widthMatch || !heightMatch || !tileSizeMatch) {
        throw new Error('Invalid DZI file: missing required attributes');
      }

      const width = parseInt(widthMatch[1] || '0');
      const height = parseInt(heightMatch[1] || '0');
      const actualTileSize = parseInt(tileSizeMatch[1] || '512');
      const actualOverlap = overlapMatch ? parseInt(overlapMatch[1] || '0') : 0;

      // Calculate levels based on actual dimensions
      const maxDimension = Math.max(width, height);
      // For very small images, ensure at least 1 level
      const levels = Math.max(1, Math.ceil(Math.log2(maxDimension / actualTileSize)) + 1);

      const tileInfo: TileInfo = {
        tileSize: actualTileSize,
        levels,
        minLevel: 0,
        maxLevel: levels - 1,
        dziPath
      };

      console.log('📊 Calculated tile info:', tileInfo);

      return tileInfo;
    } catch (error) {
      console.error('❌ Tiling failed:', error);
      throw new Error(`Failed to create tiles for image ${imageId}: ${error}`);
    }
  }

  public async getImageMetadata(imagePath: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await fs.stat(imagePath);

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image: missing width or height');
      }

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown',
        size: stats.size
      };
    } catch (error) {
      throw new Error(`Failed to get image metadata: ${error}`);
    }
  }

  public async validateImage(imagePath: string): Promise<{
    isValid: boolean;
    error?: string;
    metadata?: {
      width: number;
      height: number;
      format: string;
      size: number;
    };
  }> {
    try {
      const metadata = await this.getImageMetadata(imagePath);

      // Check minimum dimensions
      if (metadata.width < 100 || metadata.height < 100) {
        return {
          isValid: false,
          error: 'Image dimensions must be at least 100x100 pixels'
        };
      }

      // Check maximum dimensions (reasonable limit for processing)
      const maxDimension = 50000;
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        return {
          isValid: false,
          error: `Image dimensions must not exceed ${maxDimension}x${maxDimension} pixels`
        };
      }

      return {
        isValid: true,
        metadata
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to validate image: ${error}`
      };
    }
  }

  private async createOpenSeadragonDzi(
    imageId: string, 
    width: number, 
    height: number, 
    options: TilingOptions
  ): Promise<void> {
    const dziPath = storageService.getDziPath(imageId);
    const dziContent = `<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
       Url="${imageId}_files/"
       Format="png"
       Overlap="${options.overlap}"
       TileSize="${options.tileSize}"
       Width="${width}"
       Height="${height}">
</Image>`;

    try {
      await fs.writeFile(dziPath, dziContent, 'utf8');
      console.log('✅ Created OpenSeaDragon-compatible DZI file');
    } catch (error) {
      throw new Error(`Failed to create DZI file: ${error}`);
    }
  }

  public async cleanupTiles(imageId: string): Promise<void> {
    const tilesPath = storageService.getTilesPath(imageId);

    try {
      await fs.rm(tilesPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup tiles for ${imageId}:`, error);
    }
  }

  public async getTilingProgress(imagePath: string): Promise<{
    estimatedTime: number;
    totalTiles: number;
  }> {
    try {
      const metadata = await this.getImageMetadata(imagePath);
      const maxDimension = Math.max(metadata.width, metadata.height);
      const tileSize = this.defaultOptions.tileSize;
      const levels = Math.ceil(Math.log2(maxDimension / tileSize)) + 1;

      // Estimate total tiles (rough calculation)
      let totalTiles = 0;
      for (let level = 0; level < levels; level++) {
        const scale = Math.pow(2, level);
        const levelWidth = Math.ceil(metadata.width / scale);
        const levelHeight = Math.ceil(metadata.height / scale);
        const tilesX = Math.ceil(levelWidth / tileSize);
        const tilesY = Math.ceil(levelHeight / tileSize);
        totalTiles += tilesX * tilesY;
      }

      // Rough time estimation (based on image size and complexity)
      const estimatedTime = Math.max(5, Math.ceil(totalTiles / 100)); // seconds

      return {
        estimatedTime,
        totalTiles
      };
    } catch (error) {
      return {
        estimatedTime: 30,
        totalTiles: 0
      };
    }
  }
}

export const tilerService = new TilerService();
