import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Repeat, Repeat1, Shuffle,
  ListMusic, Maximize2
} from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { formatTime } from '../../utils/helpers';
import { motion } from 'framer-motion';

export default function PlayerBar() {
  const {
    currentSong, isPlaying, currentTime, duration,
    volume, isMuted, repeatMode, isShuffle,
    togglePlay, playNext, playPrev,
    setVolume, toggleMute, seekTo,
    setRepeat, toggleShuffle, toggleMiniPlayer
  } = usePlayer();
  const navigate = useNavigate();

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const cycleRepeat = () => {
    if (repeatMode === 'none') setRepeat('all');
    else if (repeatMode === 'all') setRepeat('one');
    else setRepeat('none');
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 glass border-t"
      style={{ borderColor: 'rgba(187, 178, 143, 0.2)' }}
    >
      {/* Progress bar */}
      <div className="relative h-1 group cursor-pointer"
        style={{ background: 'rgba(187, 178, 143, 0.3)' }}>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={e => seekTo(Number(e.target.value))}
          className="progress-bar absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="h-full transition-all rounded-full"
          style={{ width: `${progress}%`, background: '#2c2c2c' }}
        />
      </div>

      <div className="flex items-center px-4 py-3 gap-4">
        {/* Song info */}
        <div
          className="flex items-center gap-3 w-56 flex-shrink-0 cursor-pointer"
          onClick={() => navigate('/now-playing')}
        >
          <img
            src={currentSong.cover}
            alt={currentSong.title}
            className="w-12 h-12 rounded-lg object-cover shadow-card"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold line-clamp-1" style={{ color: '#383318' }}>
              {currentSong.title}
            </p>
            <p className="text-xs line-clamp-1" style={{ color: '#665f41' }}>
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-lg transition-all ${isShuffle ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              <Shuffle size={16} style={{ color: '#2c2c2c' }} />
            </button>

            {/* Prev */}
            <button
              onClick={playPrev}
              className="p-2 rounded-lg hover:bg-[#f2e8c7] transition-all"
            >
              <SkipBack size={20} style={{ color: '#383318' }} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              style={{ background: '#2c2c2c' }}
            >
              {isPlaying
                ? <Pause size={18} color="#fff9ec" />
                : <Play size={18} color="#fff9ec" className="ml-0.5" />
              }
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              className="p-2 rounded-lg hover:bg-[#f2e8c7] transition-all"
            >
              <SkipForward size={20} style={{ color: '#383318' }} />
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeat}
              className={`p-1.5 rounded-lg transition-all ${
                repeatMode !== 'none' ? 'opacity-100' : 'opacity-40 hover:opacity-70'
              }`}
            >
              {repeatMode === 'one'
                ? <Repeat1 size={16} style={{ color: '#2c2c2c' }} />
                : <Repeat size={16} style={{ color: '#2c2c2c' }} />
              }
            </button>
          </div>

          {/* Time */}
          <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: '#827b5b' }}>
            <span>{formatTime(currentTime)}</span>
            <span className="opacity-40">·</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 w-48 justify-end">
          {/* Volume */}
          <button onClick={toggleMute} className="p-1.5 hover:bg-[#f2e8c7] rounded-lg transition-all">
            {isMuted || volume === 0
              ? <VolumeX size={16} style={{ color: '#665f41' }} />
              : <Volume2 size={16} style={{ color: '#665f41' }} />
            }
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="volume-bar hidden sm:block"
          />

          {/* Queue */}
          <button
            onClick={() => navigate('/now-playing?tab=queue')}
            className="p-1.5 hover:bg-[#f2e8c7] rounded-lg transition-all"
          >
            <ListMusic size={16} style={{ color: '#665f41' }} />
          </button>

          {/* Maximize (Now playing full page) */}
          <button
            onClick={() => navigate('/now-playing')}
            className="p-1.5 hover:bg-[#f2e8c7] rounded-lg transition-all"
          >
            <Maximize2 size={16} style={{ color: '#665f41' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
