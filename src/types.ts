export interface VideoItem {
  id: string;
  title: string;
  thumb: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ThemeId = 'cyan' | 'purple' | 'emerald';

export type Appearance = 'dark' | 'light';

export type RepeatMode = 'off' | 'one' | 'all';

export interface AppSettings {
  theme: ThemeId;
  appearance: Appearance;
  shuffle: boolean;
  repeat: RepeatMode;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface YTPlayer {
  getDuration(): number;
  getCurrentTime(): number;
  destroy(): void;
}

export interface YTOnStateChangeEvent {
  data: number;
}

export interface YTPlayerOptions {
  events?: {
    onStateChange?: (event: YTOnStateChangeEvent) => void;
  };
}

export const YTPlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
      PlayerState: typeof YTPlayerState;
    };
  }
}

export {};
