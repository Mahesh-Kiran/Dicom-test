// Test setup for backend
import { jest } from '@jest/globals';

// Mock sharp module
jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'png',
    }),
    png: jest.fn().mockReturnThis(),
    tile: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock fs promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock content'),
  stat: jest.fn().mockResolvedValue({ size: 1024 }),
  access: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue([]),
  rm: jest.fn().mockResolvedValue(undefined),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

// Global test timeout
jest.setTimeout(10000);
