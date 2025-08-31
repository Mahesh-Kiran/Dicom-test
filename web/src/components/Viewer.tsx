import React, { useEffect, useRef, useCallback } from 'react';
import OpenSeadragon from 'openseadragon';
import { useViewerStore } from '@/store/useViewerStore';
import { getDziUrl } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ViewerProps {
  className?: string;
}

export const Viewer: React.FC<ViewerProps> = ({ className }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdRef = useRef<OpenSeadragon.Viewer | null>(null);
  
  const { manifest, isLoading, error } = useViewerStore((state) => state.viewer);
  const { setLoading, setError, setZoom, setPan } = useViewerStore();

  const initializeViewer = useCallback(() => {
    console.log('🎯 Initializing viewer with manifest:', manifest);
    if (!viewerRef.current || !manifest) {
      console.log('❌ Cannot initialize: viewerRef.current =', !!viewerRef.current, 'manifest =', !!manifest);
      return;
    }

    // Ensure the DOM element is ready
    console.log('🎯 DOM element dimensions:', {
      offsetWidth: viewerRef.current.offsetWidth,
      offsetHeight: viewerRef.current.offsetHeight,
      clientWidth: viewerRef.current.clientWidth,
      clientHeight: viewerRef.current.clientHeight
    });
    
    if (!viewerRef.current.offsetWidth || !viewerRef.current.offsetHeight) {
      console.log('🎯 DOM element not ready, retrying in 100ms...');
      setTimeout(() => initializeViewer(), 100);
      return;
    }

    if (osdRef.current) {
      osdRef.current.destroy();
    }

    const dziUrl = getDziUrl(manifest.id);
    console.log('🎯 Using DZI URL:', dziUrl);
    console.log('🎯 API Base URL:', API_BASE_URL);
    
    // Test the DZI URL directly
    console.log('🎯 Testing DZI URL fetch...');
    fetch(dziUrl)
      .then(res => {
        console.log('🎯 DZI fetch result:', res.status, res.statusText);
        console.log('🎯 DZI response headers:', Object.fromEntries(res.headers.entries()));
        if (!res.ok) {
          console.error('🎯 DZI fetch failed:', res.status, res.statusText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.text();
      })
      .then(text => {
        console.log('🎯 DZI content preview:', text.substring(0, 200) + '...');
        console.log('🎯 DZI content length:', text.length);
      })
      .catch(err => {
        console.error('🎯 DZI fetch error:', err);
        console.error('🎯 DZI fetch error details:', {
          message: err.message,
          stack: err.stack,
          url: dziUrl
        });
      });
    
    const viewer = OpenSeadragon({
      id: viewerRef.current,
      tileSources: dziUrl,
      maxZoomPixelRatio: 2,
      visibilityRatio: 0.5,
      showNavigator: true,
      navigatorPosition: 'BOTTOM_RIGHT',
      navigatorSizeRatio: 0.2,
      navigatorMaintainSizeRatio: true,
      navigatorTopRatio: 0.1,
      navigatorLeftRatio: 0.8,
      navigatorBackground: '#000000',
      navigatorBorderColor: '#555555',
      navigatorDisplayMode: 'always',
      animationTime: 0.5,
      blendTime: 0.1,
      constrainDuringPan: true,
      maxZoomLevel: 20,
      minZoomLevel: 0.1,
      zoomPerScroll: 1.2,
      zoomPerClick: 2,
      clickToZoom: true,
      dblClickToZoom: true,
      keyboard: true,
      immediateRender: false,
      wrapHorizontal: false,
      wrapVertical: false,
      gestureSettingsMouse: {
        clickToZoom: true,
        dblClickToZoom: true,
      },
      gestureSettingsTouch: {
        pinchToZoom: true,
        clickToZoom: true,
        dblClickToZoom: true,
      },
      gestureSettingsPen: {
        clickToZoom: true,
        dblClickToZoom: true,
      },
    });

    viewer.addHandler('open', () => {
      setLoading(false);
      setError(null);
    });

    viewer.addHandler('error', (event) => {
      console.error('OpenSeadragon error:', event);
      console.error('Error details:', {
        message: event.message,
        source: event.source,
        tileSource: getDziUrl(manifest.id)
      });
      setError(`Failed to load image: ${event.message || 'Unknown error'}`);
      setLoading(false);
    });

    viewer.addHandler('animation', () => {
      const viewport = viewer.viewport;
      setZoom(viewport.getZoom());
      const center = viewport.getCenter();
      setPan({ x: center.x, y: center.y });
    });

    osdRef.current = viewer;
  }, [manifest, setLoading, setError, setZoom, setPan]);

  useEffect(() => {
    console.log('Viewer useEffect - manifest changed:', manifest);
    if (manifest) {
      console.log('Manifest exists, setting loading and initializing viewer');
      setLoading(true);
      
      // Use a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeViewer();
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      console.log('No manifest, resetting loading state');
      setLoading(false);
    }
  }, [manifest, initializeViewer, setLoading]);

  useEffect(() => {
    return () => {
      if (osdRef.current) {
        osdRef.current.destroy();
      }
    };
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading image</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading image...</p>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No image loaded</p>
          <p className="text-sm text-muted-foreground">Upload an image to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={viewerRef} 
      className={`w-full h-full bg-black ${className}`}
      style={{ 
        minHeight: '400px',
        minWidth: '300px',
        position: 'relative'
      }}
    />
  );
};
