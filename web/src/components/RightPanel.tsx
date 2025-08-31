import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Brain, Droplets, Zap } from 'lucide-react';
import { useViewerStore } from '@/store/useViewerStore';
import { cn } from '@/lib/utils';

interface RightPanelProps {
  className?: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({ className }) => {
  const { rightPanelCollapsed, toggleRightPanel } = useViewerStore();

  if (rightPanelCollapsed) {
    return (
      <div className={cn("flex flex-col items-center p-2", className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightPanel}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">DETR Predictions</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightPanel}
          className="h-6 w-6"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>Coming Soon</span>
            </CardTitle>
            <CardDescription>
              This panel will render inference overlays from DETR model predictions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Oil Detection</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Water Detection</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Model Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">DETR Model</span>
                <span className="text-sm text-muted-foreground">Not Loaded</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inference Engine</span>
                <span className="text-sm text-muted-foreground">Idle</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <span>Detection Legend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Future legend will show detected objects and their confidence scores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
