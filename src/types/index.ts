export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar: string;
  bio?: string;
  following: string[];
  followers: string[];
  createdAt: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  duration: number;
  url: string;
  cover: string;
  genre: string;
  mood: 'calm' | 'energetic' | 'happy' | 'sad' | 'romantic';
  year: number;
  lyrics: LyricLine[];
  playCount: number;
  trending: boolean;
  createdAt: string;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  cover: string;
  genre: string[];
  followers: number;
  monthlyListeners: number;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  cover: string;
  year: number;
  genre: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  cover: string;
  userId: string;
  songIds: string[];
  isPublic: boolean;
  isAuto: boolean;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListenHistory {
  id: string;
  userId: string;
  songId: string;
  playedAt: string;
  duration: number;
}

export interface Like {
  id: string;
  userId: string;
  songId: string;
}

// Player state
export type RepeatMode = 'none' | 'one' | 'all';

export interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  showMiniPlayer: boolean;
}

// Search
export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

// Stats
export interface WeeklyStats {
  totalMinutes: number;
  uniqueSongs: number;
  topGenre: string;
  streakDays: number;
  topSongs: Array<{ song: Song; count: number }>;
  genreDistribution: Array<{ genre: string; count: number; percentage: number }>;
  dailyActivity: Array<{ day: string; minutes: number }>;
}

// Recommendation
export interface Recommendation {
  song: Song;
  score: number;
  reason: string;
}
