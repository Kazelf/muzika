import React, {
  createContext, useContext, useReducer, useRef, useEffect, useCallback
} from 'react';
import { Song, PlayerState, RepeatMode } from '../types';
import { clamp } from '../utils/helpers';
import { historyService, songsService } from '../services/music.service';
import { useAuth } from './AuthContext';

type PlayerAction =
  | { type: 'SET_SONG'; song: Song; queue?: Song[] }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_REPEAT'; mode: RepeatMode }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'ADD_TO_QUEUE'; song: Song }
  | { type: 'SET_QUEUE'; queue: Song[] }
  | { type: 'TOGGLE_MINI_PLAYER' }
  | { type: 'CLOSE_MINI_PLAYER' };

const initialState: PlayerState = {
  currentSong: null,
  queue: [],
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  repeatMode: 'none',
  isShuffle: false,
  showMiniPlayer: false,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_SONG':
      return {
        ...state,
        currentSong: action.song,
        queue: action.queue ?? state.queue,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing };
    case 'NEXT': {
      if (!state.currentSong || state.queue.length === 0) return state;
      if (state.isShuffle) {
        // Pick random index different from current if possible
        let nextIdx = Math.floor(Math.random() * state.queue.length);
        if (state.queue.length > 1) {
          const currentIdx = state.queue.findIndex(s => s.id === state.currentSong!.id);
          while (nextIdx === currentIdx) {
            nextIdx = Math.floor(Math.random() * state.queue.length);
          }
        }
        return { ...state, currentSong: state.queue[nextIdx], isPlaying: true, currentTime: 0 };
      }

      const idx = state.queue.findIndex(s => s.id === state.currentSong!.id);
      let nextIdx = idx + 1;
      if (nextIdx >= state.queue.length) {
        if (state.repeatMode === 'all') nextIdx = 0;
        else return { ...state, isPlaying: false };
      }
      return { ...state, currentSong: state.queue[nextIdx], isPlaying: true, currentTime: 0 };
    }
    case 'PREV': {
      if (!state.currentSong || state.queue.length === 0) return state;
      // If more than 3s played, restart; else go to previous
      if (state.currentTime > 3) return { ...state, currentTime: 0 };
      const idx = state.queue.findIndex(s => s.id === state.currentSong!.id);
      const prevIdx = Math.max(0, idx - 1);
      return { ...state, currentSong: state.queue[prevIdx], isPlaying: true, currentTime: 0 };
    }
    case 'SET_VOLUME':
      return { ...state, volume: clamp(action.volume, 0, 1), isMuted: action.volume === 0 };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'SET_TIME':
      return { ...state, currentTime: action.time };
    case 'SET_DURATION':
      return { ...state, duration: action.duration };
    case 'SET_REPEAT':
      return { ...state, repeatMode: action.mode };
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffle: !state.isShuffle };
    case 'ADD_TO_QUEUE':
      return {
        ...state,
        queue: state.queue.some(s => s.id === action.song.id)
          ? state.queue
          : [...state.queue, action.song],
      };
    case 'SET_QUEUE':
      return { ...state, queue: action.queue };
    case 'TOGGLE_MINI_PLAYER':
      return { ...state, showMiniPlayer: !state.showMiniPlayer };
    case 'CLOSE_MINI_PLAYER':
      return { ...state, showMiniPlayer: false };
    default:
      return state;
  }
}

interface PlayerContextType extends PlayerState {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  seekTo: (time: number) => void;
  setRepeat: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  addToQueue: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
  toggleMiniPlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const playStartRef = useRef<number>(0);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => dispatch({ type: 'SET_TIME', time: audio.currentTime });
    const onDurationChange = () => dispatch({ type: 'SET_DURATION', duration: audio.duration });
    const onEnded = () => {
      if (state.repeatMode !== 'one') {
        dispatch({ type: 'NEXT' });
      }
    };
    const onPlay = () => dispatch({ type: 'SET_PLAYING', playing: true });
    const onPause = () => dispatch({ type: 'SET_PLAYING', playing: false });

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [state.repeatMode]);

  // Song change (Play Count & History Logging)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentSong) return;
    audio.src = state.currentSong.url;
    audio.load();
    audio.play().catch(() => {});
    playStartRef.current = Date.now();

    // Increment Play Count
    songsService.incrementPlay(state.currentSong.id, state.currentSong.playCount).catch(() => {});

    // Add to Listen History if logged in
    if (user) {
      historyService.add({
        userId: user.id,
        songId: state.currentSong.id,
        playedAt: new Date().toISOString(),
        duration: state.currentSong.duration
      }).catch(() => {});
    }
  }, [state.currentSong?.id]);

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state.isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [state.isPlaying]);

  // Repeat Mode (Native Looping)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = state.repeatMode === 'one';
  }, [state.repeatMode]);

  // Volume/mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = state.isMuted ? 0 : state.volume;
  }, [state.volume, state.isMuted]);

  const playSong = useCallback((song: Song, queue?: Song[]) => {
    dispatch({ type: 'SET_SONG', song, queue });
  }, []);

  const togglePlay = useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), []);
  const playNext = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const playPrev = useCallback(() => dispatch({ type: 'PREV' }), []);
  const setVolume = useCallback((v: number) => dispatch({ type: 'SET_VOLUME', volume: v }), []);
  const toggleMute = useCallback(() => dispatch({ type: 'TOGGLE_MUTE' }), []);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
    dispatch({ type: 'SET_TIME', time });
  }, []);

  const setRepeat = useCallback((mode: RepeatMode) => dispatch({ type: 'SET_REPEAT', mode }), []);
  const toggleShuffle = useCallback(() => dispatch({ type: 'TOGGLE_SHUFFLE' }), []);
  const addToQueue = useCallback((song: Song) => dispatch({ type: 'ADD_TO_QUEUE', song }), []);
  const setQueue = useCallback((queue: Song[]) => dispatch({ type: 'SET_QUEUE', queue }), []);
  const toggleMiniPlayer = useCallback(() => dispatch({ type: 'TOGGLE_MINI_PLAYER' }), []);

  return (
    <PlayerContext.Provider value={{
      ...state,
      audioRef,
      playSong, togglePlay, playNext, playPrev,
      setVolume, toggleMute, seekTo,
      setRepeat, toggleShuffle,
      addToQueue, setQueue,
      toggleMiniPlayer,
    }}>
      <audio ref={audioRef} preload="auto" />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
