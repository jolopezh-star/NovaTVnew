export enum AppSection {
  Home = 'HOME',
  LoginXtream = 'LOGIN_XTREAM',
  LoginM3u = 'LOGIN_M3U',
  Main = 'MAIN',
  Search = 'SEARCH',
  Player = 'PLAYER',
  Settings = 'SETTINGS',
  Dashboard = 'DASHBOARD',
  PinLock = 'PIN_LOCK'
}

export enum SidebarTab {
  Live = 'LIVE',
  Movies = 'MOVIES',
  Series = 'SERIES',
  Favorites = 'FAVORITES',
  Recents = 'RECENTS',
  Search = 'SEARCH',
  SettingsTab = 'SETTINGS_TAB'
}

export interface Category {
  id: string;
  name: string;
  type: 'live' | 'movie' | 'series';
}

export interface IPTVItem {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  category: string;
  type: 'live' | 'movie' | 'series';
  // Xtream metadata
streamId?: string;
epgChannelId?: string;
  // Movies & Series details
  year?: string;
  genre?: string;
  duration?: string;
  description?: string;
  rating?: string;
  director?: string;
  cast?: string;
  // Series specific
  seasonsCount?: number;
  episodes?: Episode[];
}

export interface Episode {
  id: string;
  title: string;
  season: number;
  episode: number;
  streamUrl: string;
  duration?: string;
  description?: string;
  logo?: string;
}

export interface EPGProgram {
  title: string;
  start: string; // ISO or Time string
  end: string;
  description: string;
}

export interface PlaybackProgress {
  itemId: string;
  position: number; // in seconds
  duration: number; // in seconds
  percentage: number;
  updatedAt: number; // timestamp
  episodeId?: string; // for series
}

export interface AppSettings {
  language: 'es' | 'en';
  theme: 'electric-dark' | 'neon-blue' | 'classic-dark';
  fontSize: 'normal' | 'large' | 'extra-large';
  autoQuality: boolean;
  hiddenCategories: string[]; // Category IDs to hide
  adultPin: string; // PIN for adult content (empty if disabled)
  isAdultPinLocked: boolean;
}

export interface XtreamCredentials {
  url: string;
  username: string;
  password: string;
  profileName?: string;
}

export interface M3uConfig {
  url?: string;
  rawContent?: string;
  name: string;
}
