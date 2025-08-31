import { UploadResponse, ImageManifest } from '@/types/manifest';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.error;
    } catch {
      // If we can't parse the error response, use the default message
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return response.json();
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

export async function getImageManifest(imageId: string): Promise<ImageManifest> {
  const response = await fetch(`${API_BASE_URL}/api/images/${imageId}/manifest`);
  return handleResponse<ImageManifest>(response);
}

export async function getImageStats(imageId: string): Promise<{
  id: string;
  uploadSize: number;
  tilesSize: number;
  totalSize: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/images/${imageId}/stats`);
  return handleResponse(response);
}

export async function deleteImage(imageId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new ApiError(`Failed to delete image: ${response.statusText}`, response.status);
  }
}

export async function checkServerHealth(): Promise<{
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
}

// Upload with progress tracking
export function uploadImageWithProgress(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new ApiError('Invalid JSON response', xhr.status));
        }
      } else {
        reject(new ApiError(`Upload failed: ${xhr.statusText}`, xhr.status));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError('Network error during upload', 0));
    });

    xhr.addEventListener('abort', () => {
      reject(new ApiError('Upload was aborted', 0));
    });

    xhr.open('POST', `${API_BASE_URL}/api/images/upload`);
    xhr.send(formData);
  });
}

// Utility function to get tile URL
export function getTileUrl(imageId: string, level: number, x: number, y: number): string {
  return `${API_BASE_URL}/tiles/${imageId}/${level}/${x}_${y}.png`;
}

// Utility function to get DZI URL
export function getDziUrl(imageId: string): string {
  return `${API_BASE_URL}/tiles/${imageId}/${imageId}.dzi`;
}

export { ApiError };
