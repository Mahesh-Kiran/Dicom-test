import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileImage, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useViewerStore } from '@/store/useViewerStore';
import { uploadImageWithProgress } from '@/lib/api';
import { isValidImageFile, getImageValidationError, formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface UploadButtonProps {
  className?: string;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ className }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  const {
    isUploading,
    progress,
    error,
    currentFile,
    setUploading,
    setUploadProgress,
    setUploadError,
    setCurrentFile,
    resetUpload,
    setManifest,
    setLoading
  } = useViewerStore();

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = getImageValidationError(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setCurrentFile(file);
    setUploading(true);
    setUploadError(null);
    setLoading(true);

    try {
      const response = await uploadImageWithProgress(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log('Upload successful, response:', response);
      setManifest(response);
      setUploadProgress(100);
      
      // Reset upload state after a delay
      setTimeout(() => {
        resetUpload();
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setLoading(false);
    }
  }, [setCurrentFile, setUploading, setUploadError, setLoading, setManifest, setUploadProgress, resetUpload]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => isValidImageFile(file));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      setUploadError('Please drop a valid image file (PNG, JPEG, or TIFF)');
    }
  }, [handleFileSelect, setUploadError]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCancel = useCallback(() => {
    resetUpload();
    setLoading(false);
  }, [resetUpload, setLoading]);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/tiff,image/tif"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />

      <AnimatePresence>
        {isUploading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <FileImage className="h-8 w-8 text-primary" />
                      {isUploading && (
                        <Loader2 className="absolute -right-1 -top-1 h-4 w-4 animate-spin text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {currentFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(currentFile?.size || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {Math.round(progress)}%
                      </p>
                      <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancel}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleClick}
                  disabled={isUploading}
                  className={cn(
                    "w-full h-12 border-2 border-dashed transition-all duration-200",
                    isDragOver
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                  )}
                  variant="ghost"
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span className="font-medium">
                      {isDragOver ? "Drop image here" : "Upload Image"}
                    </span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to select or drag and drop an image file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PNG, JPEG, TIFF up to 500MB
                </p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md"
        >
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}
    </div>
  );
};
