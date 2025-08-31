import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UploadButton } from '../UploadButton';

// Mock the store
vi.mock('@/store/useViewerStore', () => ({
  useViewerStore: vi.fn(() => ({
    isUploading: false,
    progress: 0,
    error: null,
    currentFile: null,
    setUploading: vi.fn(),
    setUploadProgress: vi.fn(),
    setUploadError: vi.fn(),
    setCurrentFile: vi.fn(),
    resetUpload: vi.fn(),
    setManifest: vi.fn(),
    setLoading: vi.fn(),
  })),
}));

// Mock the API
vi.mock('@/lib/api', () => ({
  uploadImageWithProgress: vi.fn(),
}));

describe('UploadButton', () => {
  it('renders upload button', () => {
    render(<UploadButton />);
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('shows drag and drop text when dragging over', () => {
    render(<UploadButton />);
    const button = screen.getByText('Upload Image').closest('button');
    
    if (button) {
      fireEvent.dragEnter(button);
      expect(screen.getByText('Drop image here')).toBeInTheDocument();
    }
  });
});
