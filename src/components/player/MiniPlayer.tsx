import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, SkipForward, Music } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../../utils/helpers';

export default function MiniPlayer() {
  const {
    currentSong, isPlaying, currentTime, duration,
    showMiniPlayer, togglePlay, playNext, toggleMiniPlayer
  } = usePlayer();
  const navigate = useNavigate();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {showMiniPlayer && currentSong && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          drag
          dragConstraints={{ left: -200, right: 200, top: -400, bottom: 100 }}
          className="fixed bottom-24 right-6 z-50 rounded-2xl shadow-float overflow-hidden cursor-grab active:cursor-grabbing w-72"
          style={{ background: '#f6eed2' }}
        >
          {/* Progress overlay */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-[#2c2c2c] transition-all"
            style={{ width: `${progress}%` }} />

          <div className="p-3">
            <div className="flex items-center gap-3">
              <div
                className="relative cursor-pointer"
                onClick={() => navigate('/now-playing')}
              >
                <img
                  src={currentSong.cover}
                  alt={currentSong.title}
                  className={`w-12 h-12 rounded-xl object-cover vinyl-disc ${isPlaying ? 'playing' : ''}`}
                />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(56,51,24,0.1)' }}>
                  <Music size={12} color="white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1" style={{ color: '#383318' }}>
                  {currentSong.title}
                </p>
                <p className="text-xs line-clamp-1" style={{ color: '#665f41' }}>
                  {currentSong.artist}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#bbb28f' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#2c2c2c' }}
                >
                  {isPlaying
                    ? <Pause size={14} color="#fff9ec" />
                    : <Play size={14} color="#fff9ec" className="ml-0.5" />
                  }
                </button>
                <button onClick={playNext}
                  className="p-1.5 hover:bg-[#ede3bd] rounded-lg transition-colors">
                  <SkipForward size={14} style={{ color: '#665f41' }} />
                </button>
                <button onClick={toggleMiniPlayer}
                  className="p-1.5 hover:bg-[#ede3bd] rounded-lg transition-colors">
                  <X size={14} style={{ color: '#827b5b' }} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
