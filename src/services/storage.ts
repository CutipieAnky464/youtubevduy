import type { AppSettings, VideoItem } from '../types';

const FAVORITES_KEY = 'neonplay_favorites';
const PLAYLIST_KEY = 'neonplay_playlist';
const SETTINGS_KEY = 'neonplay_settings';
const HISTORY_KEY = 'neonplay_search_history';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cyan',
  appearance: 'dark',
  shuffle: false,
  repeat: 'off',
};

export function loadFavorites(): VideoItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as VideoItem[]) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: VideoItem[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function loadPlaylist(): VideoItem[] {
  try {
    const raw = localStorage.getItem(PLAYLIST_KEY);
    return raw ? (JSON.parse(raw) as VideoItem[]) : [];
  } catch {
    return [];
  }
}

export function savePlaylist(playlist: VideoItem[]): void {
  localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as AppSettings) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string, max = 8): string[] {
  const trimmed = query.trim();
  if (!trimmed) return loadSearchHistory();

  const history = loadSearchHistory().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  history.unshift(trimmed);
  const next = history.slice(0, max);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearSearchHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
