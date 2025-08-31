import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { storageService } from '../services/storage';
import { tilerService } from '../services/tiler';
import { UploadResponse, ImageManifest, ErrorResponse } from '../types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/tif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// POST /api/images/upload - Upload and tile an image
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'No file uploaded',
        statusCode: 400
      } as ErrorResponse);
    }

    // Validate file
    const validation = storageService.validateFile(req.file);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: validation.error || 'Invalid file',
        statusCode: 400
      } as ErrorResponse);
    }

    // Generate unique ID for the image
    const imageId = storageService.generateImageId();
    const originalName = req.file.originalname;
    const uploadPath = storageService.getUploadPath(imageId, originalName);

    // Create directories
    await storageService.createImageDirectory(imageId);

    // Save the uploaded file
    await fs.writeFile(uploadPath, req.file.buffer);

    // Validate image dimensions and format
    const imageValidation = await tilerService.validateImage(uploadPath);
    if (!imageValidation.isValid) {
      await storageService.deleteImage(imageId);
      return res.status(400).json({
        error: 'IMAGE_VALIDATION_ERROR',
        message: imageValidation.error || 'Invalid image',
        statusCode: 400
      } as ErrorResponse);
    }

    // Create tiles
    const metadata = imageValidation.metadata!;
    console.log(`Starting tile generation for image ${imageId} (${metadata.width}x${metadata.height})`);
    const tileInfo = await tilerService.createTiles(uploadPath, imageId);
    console.log(`Tile generation completed for image ${imageId}:`, tileInfo);

    // Verify DZI file was created
    const dziPath = storageService.getDziPath(imageId);
    const dziExists = await fs.access(dziPath).then(() => true).catch(() => false);
    
    if (!dziExists) {
      console.error(`DZI file not created for image ${imageId}`);
      await storageService.deleteImage(imageId);
      return res.status(500).json({
        error: 'TILING_ERROR',
        message: 'Failed to create image tiles',
        statusCode: 500
      } as ErrorResponse);
    }

    console.log(`DZI file created successfully: ${dziPath}`);

    // Prepare response
    const response: UploadResponse = {
      id: imageId,
      width: metadata.width,
      height: metadata.height,
      dziUrl: storageService.getDziUrl(imageId),
      tileInfo: {
        ...tileInfo,
        dziPath: storageService.getDziPath(imageId)
      },
      createdAt: new Date()
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to process uploaded image',
      statusCode: 500
    } as ErrorResponse);
  }
});

// GET /api/images/:id/manifest - Get image manifest
router.get('/:id/manifest', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if image exists
    const exists = await storageService.imageExists(id);
    if (!exists) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Image not found',
        statusCode: 404
      } as ErrorResponse);
    }

    // Get image stats
    const stats = await storageService.getImageStats(id);
    const dziPath = storageService.getDziPath(id);

    // Read DZI file to get dimensions
    const dziContent = await fs.readFile(dziPath, 'utf8');
    
    // Parse DZI XML to extract dimensions
    const widthMatch = dziContent.match(/Width="(\d+)"/);
    const heightMatch = dziContent.match(/Height="(\d+)"/);
    const tileSizeMatch = dziContent.match(/TileSize="(\d+)"/);
    
    if (!widthMatch || !heightMatch || !tileSizeMatch) {
      return res.status(500).json({
        error: 'INVALID_MANIFEST',
        message: 'Invalid DZI manifest file',
        statusCode: 500
      } as ErrorResponse);
    }

    const width = parseInt(widthMatch[1]);
    const height = parseInt(heightMatch[1]);
    const tileSize = parseInt(tileSizeMatch[1]);

    // Calculate levels
    const maxDimension = Math.max(width, height);
    const levels = Math.ceil(Math.log2(maxDimension / tileSize)) + 1;

    const manifest: ImageManifest = {
      id,
      width,
      height,
      dziUrl: storageService.getDziUrl(id),
      tileInfo: {
        tileSize,
        levels,
        minLevel: 0,
        maxLevel: levels - 1,
        dziPath
      },
      createdAt: new Date() // We don't store this, so using current time
    };

    res.json(manifest);
  } catch (error) {
    console.error('Manifest error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve image manifest',
      statusCode: 500
    } as ErrorResponse);
  }
});

// GET /api/images/:id/stats - Get image statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if image exists
    const exists = await storageService.imageExists(id);
    if (!exists) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Image not found',
        statusCode: 404
      } as ErrorResponse);
    }

    // Get image stats
    const stats = await storageService.getImageStats(id);

    res.json({
      id,
      uploadSize: stats.uploadSize,
      tilesSize: stats.tilesSize,
      totalSize: stats.uploadSize + stats.tilesSize
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve image statistics',
      statusCode: 500
    } as ErrorResponse);
  }
});

// DELETE /api/images/:id - Delete an image and its tiles
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if image exists
    const exists = await storageService.imageExists(id);
    if (!exists) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Image not found',
        statusCode: 404
      } as ErrorResponse);
    }

    // Delete image and tiles
    await storageService.deleteImage(id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete image',
      statusCode: 500
    } as ErrorResponse);
  }
});

// Error handling middleware for multer
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds the limit of 500MB',
        statusCode: 400
      } as ErrorResponse);
    }
  }

  if (error.message) {
    return res.status(400).json({
      error: 'UPLOAD_ERROR',
      message: error.message,
      statusCode: 400
    } as ErrorResponse);
  }

  next(error);
});

export default router;
