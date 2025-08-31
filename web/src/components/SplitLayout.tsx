import React from 'react';
import { UploadButton } from './UploadButton';
import { Viewer } from './Viewer';
import { Toolbar } from './Toolbar';
import { RightPanel } from './RightPanel';
import { useViewerStore } from '@/store/useViewerStore';
import { cn } from '@/lib/utils';

interface SplitLayoutProps {
  className?: string;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({ className }) => {
  const { rightPanelCollapsed } = useViewerStore();

  return (
    <div className={cn("flex h-full", className)}>
      {/* Left Panel - Viewer */}
      <div className={cn(
        "flex-1 relative bg-background",
        rightPanelCollapsed ? "w-full" : "w-[70%]"
      )}>
        {/* Header with Upload */}
        <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-full px-4">
            <h1 className="text-xl font-bold">SAR Deep Zoom</h1>
            <div className="w-64">
              <UploadButton />
            </div>
          </div>
        </div>

        {/* Viewer Container */}
        <div className="relative h-[calc(100%-4rem)]">
          <Viewer />
          <Toolbar />
        </div>
      </div>

      {/* Right Panel - DETR Predictions */}
      <div className={cn(
        "border-l bg-muted/30",
        rightPanelCollapsed ? "w-12" : "w-[30%]"
      )}>
        <RightPanel />
      </div>
    </div>
  );
};
