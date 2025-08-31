export interface TileInfo {
  tileSize: number;
  levels: number;
  minLevel: number;
  maxLevel: number;
  dziPath: string;
}

export interface ImageManifest {
  id: string;
  width: number;
  height: number;
  dziUrl: string;
  tileInfo: TileInfo;
  createdAt: Date;
}

export interface UploadResponse {
  id: string;
  width: number;
  height: number;
  dziUrl: string;
  tileInfo: TileInfo;
  createdAt: Date;
}

export interface ViewerState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  manifest: ImageManifest | null;
  zoom: number;
  pan: { x: number; y: number };
  isFullscreen: boolean;
  showNavigator: boolean;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  currentFile: File | null;
}

export interface AppState {
  viewer: ViewerState;
  upload: UploadState;
  rightPanelCollapsed: boolean;
  theme: 'light' | 'dark';
}

export interface KeyboardShortcuts {
  [key: string]: {
    action: string;
    description: string;
  };
}

export interface ToolbarAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
}

export interface TileLoadingState {
  loaded: number;
  total: number;
  isLoading: boolean;
}
