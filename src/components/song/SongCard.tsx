import { Play, Pause } from 'lucide-react';
import { Song } from '../../types';
import { usePlayer } from '../../contexts/PlayerContext';
import { formatTime } from '../../utils/helpers';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import AddToPlaylistModal from '../playlist/AddToPlaylistModal';

interface SongCardProps {
  song: Song;
  queue?: Song[];
  index?: number;
}

export default function SongCard({ song, queue, index }: SongCardProps) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [showAddModal, setShowAddModal] = useState(false);
  const isActive = currentSong?.id === song.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.06 }}
      onClick={() => playSong(song, queue || [song])}
      className="group relative rounded-2xl overflow-hidden cursor-pointer card-hover p-3"
      style={{ background: '#fbf3dd' }}
    >
      {/* Album Art */}
      <div className="relative aspect-square mb-3 overflow-hidden rounded-xl">
        <img
          src={song.cover}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-200"
          style={{
            background: isActive
              ? 'rgba(44,44,44,0.4)'
              : 'rgba(44,44,44,0)',
          }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: '#fff9ec',
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'scale(1)' : 'scale(0.8)',
            }}
          >
            {isActive && isPlaying
              ? <Pause size={16} style={{ color: '#2c2c2c' }} />
              : <Play size={16} style={{ color: '#2c2c2c' }} className="ml-0.5" />
            }
          </div>
        </div>
        {/* Style on hover via group */}
        <style>{`
          .group:hover .play-overlay { opacity: 1 !important; }
          .group:hover .play-btn { opacity: 1 !important; transform: scale(1) !important; }
        `}</style>
        <div className="play-overlay absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(44,44,44,0.35)', opacity: isActive ? 1 : 0, transition: 'opacity 0.2s' }}>
          <div className="play-btn w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: '#fff9ec',
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'scale(1)' : 'scale(0.8)',
              transition: 'all 0.2s'
            }}>
            {isActive && isPlaying
              ? <Pause size={16} style={{ color: '#2c2c2c' }} />
              : <Play size={16} style={{ color: '#2c2c2c' }} className="ml-0.5" />
            }
          </div>
          <button 
            onClick={e => { e.stopPropagation(); setShowAddModal(true); }}
            className="play-btn absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-primary hover:scale-110"
            style={{
              opacity: 0,
              transform: 'scale(0.8)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={14} color="#fff9ec" />
          </button>
        </div>

        {/* Trending badge */}
        {song.trending && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: '#2c2c2c', color: '#fff9ec' }}>
            🔥
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-sm font-semibold line-clamp-1" style={{ color: '#383318' }}>
          {song.title}
        </p>
        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: '#665f41' }}>
          {song.artist}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs" style={{ color: '#bbb28f' }}>{song.genre}</span>
          <span className="text-xs" style={{ color: '#bbb28f' }}>{formatTime(song.duration)}</span>
        </div>
      </div>
      
      {showAddModal && <AddToPlaylistModal song={song} onClose={() => setShowAddModal(false)} />}
    </motion.div>
  );
}
