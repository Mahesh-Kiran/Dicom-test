import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import fs from 'fs/promises';
import imagesRouter from './routes/images';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for tiles
app.use('/tiles', express.static(path.join(process.cwd(), 'data', 'tiles'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set CORS headers for all tile files
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set appropriate cache headers for different file types
    if (filePath.endsWith('.dzi')) {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else if (filePath.endsWith('.png') || filePath.endsWith('.jpg')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to test DZI generation
app.get('/api/debug/dzi/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dziPath = path.join(process.cwd(), 'data', 'tiles', id, `${id}.dzi`);
    
    console.log('🔍 Debug DZI request for ID:', id);
    console.log('🔍 DZI path:', dziPath);
    
    const exists = await fs.access(dziPath).then(() => true).catch(() => false);
    console.log('🔍 DZI exists:', exists);
    
    if (!exists) {
      // Check what files exist in the tiles directory
      const tilesDir = path.join(process.cwd(), 'data', 'tiles', id);
      const tilesExists = await fs.access(tilesDir).then(() => true).catch(() => false);
      
      if (tilesExists) {
        const files = await fs.readdir(tilesDir, { withFileTypes: true });
        console.log('🔍 Files in tiles directory:', files.map(f => ({ name: f.name, isDirectory: f.isDirectory() })));
        
        return res.status(404).json({ 
          error: 'DZI file not found',
          tilesDir,
          files: files.map(f => ({ name: f.name, isDirectory: f.isDirectory() }))
        });
      } else {
        return res.status(404).json({ 
          error: 'Tiles directory not found',
          tilesDir
        });
      }
    }
    
    const content = await fs.readFile(dziPath, 'utf8');
    console.log('🔍 DZI content length:', content.length);
    
    res.json({
      exists: true,
      path: dziPath,
      contentLength: content.length,
      content: content
    });
  } catch (error) {
    console.error('🔍 Debug DZI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API routes
app.use('/api/images', imagesRouter);

// Debug endpoint to check file structure
app.get('/api/debug/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tilesDir = path.join(process.cwd(), 'data', 'tiles', id);
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads', id);
    
    console.log('🔍 Debug files request for ID:', id);
    
    const [tilesExists, uploadsExists] = await Promise.all([
      fs.access(tilesDir).then(() => true).catch(() => false),
      fs.access(uploadsDir).then(() => true).catch(() => false)
    ]);
    
    let tilesFiles = [];
    let uploadsFiles = [];
    
    if (tilesExists) {
      tilesFiles = await fs.readdir(tilesDir, { withFileTypes: true, recursive: true });
    }
    
    if (uploadsExists) {
      uploadsFiles = await fs.readdir(uploadsDir, { withFileTypes: true, recursive: true });
    }
    
    res.json({
      id,
      tilesDir,
      uploadsDir,
      tilesExists,
      uploadsExists,
      tilesFiles: tilesFiles.map(f => ({ 
        name: f.name, 
        isDirectory: f.isDirectory(),
        path: f.path || tilesDir
      })),
      uploadsFiles: uploadsFiles.map(f => ({ 
        name: f.name, 
        isDirectory: f.isDirectory(),
        path: f.path || uploadsDir
      }))
    });
  } catch (error) {
    console.error('🔍 Debug files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Demo endpoint for testing
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'SAR Deep Zoom API is running',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/images/upload',
      manifest: 'GET /api/images/:id/manifest',
      stats: 'GET /api/images/:id/stats',
      delete: 'DELETE /api/images/:id',
      debugDzi: 'GET /api/debug/dzi/:id',
      debugFiles: 'GET /api/debug/files/:id'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    statusCode: err.status || 500
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SAR Deep Zoom Server running on port ${PORT}`);
  console.log(`📁 Tiles directory: ${path.join(process.cwd(), 'data', 'tiles')}`);
  console.log(`📁 Uploads directory: ${path.join(process.cwd(), 'data', 'uploads')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/demo`);
});

export default app;
