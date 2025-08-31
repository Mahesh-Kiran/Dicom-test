import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ViewerState, 
  UploadState, 
  AppState, 
  ImageManifest 
} from '@/types/manifest';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';

interface ViewerStore extends AppState {
  // Viewer actions
  setManifest: (manifest: ImageManifest | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setShowNavigator: (show: boolean) => void;
  resetViewer: () => void;

  // Upload actions
  setUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadError: (error: string | null) => void;
  setCurrentFile: (file: File | null) => void;
  resetUpload: () => void;

  // App actions
  toggleRightPanel: () => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetApp: () => void;
}

const initialViewerState: ViewerState = {
  isLoaded: false,
  isLoading: false,
  error: null,
  manifest: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  isFullscreen: false,
  showNavigator: true,
};

const initialUploadState: UploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  currentFile: null,
};

const initialAppState: AppState = {
  viewer: initialViewerState,
  upload: initialUploadState,
  rightPanelCollapsed: false,
  theme: 'light',
};

export const useViewerStore = create<ViewerStore>()(
  persist(
    (set, get) => ({
      ...initialAppState,

      // Viewer actions
      setManifest: (manifest) => {
        console.log('Setting manifest:', manifest);
        set((state) => ({
          viewer: {
            ...state.viewer,
            manifest,
            isLoaded: !!manifest,
            error: null,
          },
        }));
      },

      setLoading: (isLoading) => set((state) => ({
        viewer: {
          ...state.viewer,
          isLoading,
        },
      })),

      setError: (error) => set((state) => ({
        viewer: {
          ...state.viewer,
          error,
          isLoading: false,
        },
      })),

      setZoom: (zoom) => set((state) => ({
        viewer: {
          ...state.viewer,
          zoom,
        },
      })),

      setPan: (pan) => set((state) => ({
        viewer: {
          ...state.viewer,
          pan,
        },
      })),

      setFullscreen: (isFullscreen) => set((state) => ({
        viewer: {
          ...state.viewer,
          isFullscreen,
        },
      })),

      setShowNavigator: (showNavigator) => set((state) => ({
        viewer: {
          ...state.viewer,
          showNavigator,
        },
      })),

      resetViewer: () => set((state) => ({
        viewer: initialViewerState,
      })),

      // Upload actions
      setUploading: (isUploading) => set((state) => ({
        upload: {
          ...state.upload,
          isUploading,
          progress: isUploading ? 0 : state.upload.progress,
        },
      })),

      setUploadProgress: (progress) => set((state) => ({
        upload: {
          ...state.upload,
          progress,
        },
      })),

      setUploadError: (error) => set((state) => ({
        upload: {
          ...state.upload,
          error,
          isUploading: false,
        },
      })),

      setCurrentFile: (currentFile) => set((state) => ({
        upload: {
          ...state.upload,
          currentFile,
        },
      })),

      resetUpload: () => set((state) => ({
        upload: initialUploadState,
      })),

      // App actions
      toggleRightPanel: () => set((state) => ({
        rightPanelCollapsed: !state.rightPanelCollapsed,
      })),

      setRightPanelCollapsed: (rightPanelCollapsed) => set(() => ({
        rightPanelCollapsed,
      })),

      setTheme: (theme) => set(() => ({
        theme,
      })),

      resetApp: () => set(() => ({
        ...initialAppState,
      })),
    }),
    {
      name: 'sar-deep-zoom-storage',
      partialize: (state) => ({
        viewer: {
          manifest: state.viewer.manifest,
          showNavigator: state.viewer.showNavigator,
        },
        rightPanelCollapsed: state.rightPanelCollapsed,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme on rehydration
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
    }
  )
);

// Selectors for better performance
export const useViewer = () => useViewerStore((state) => state.viewer);
export const useUpload = () => useViewerStore((state) => state.upload);
export const useRightPanel = () => useViewerStore((state) => state.rightPanelCollapsed);
export const useTheme = () => useViewerStore((state) => state.theme);

// Computed selectors
export const useIsImageLoaded = () => useViewerStore((state) => state.viewer.isLoaded);
export const useCurrentManifest = () => useViewerStore((state) => state.viewer.manifest);
export const useIsUploading = () => useViewerStore((state) => state.upload.isUploading);
export const useUploadProgress = () => useViewerStore((state) => state.upload.progress);
