import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, Plus, MoreHorizontal } from 'lucide-react';
import { Song } from '../../types';
import { usePlayer } from '../../contexts/PlayerContext';
import { useAuth } from '../../contexts/AuthContext';
import { likesService } from '../../services/music.service';
import { formatTime } from '../../utils/helpers';

interface SongRowProps {
  song: Song;
  index?: number;
  queue?: Song[];
  showIndex?: boolean;
  onAddToPlaylist?: (song: Song) => void;
}

export default function SongRow({ song, index, queue, showIndex = true, onAddToPlaylist }: SongRowProps) {
  const { playSong, currentSong, isPlaying, addToQueue } = usePlayer();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = currentSong?.id === song.id;

  useEffect(() => {
    if (!user) return;
    likesService.check(user.id, song.id).then(res => {
      if (res.data.length > 0) {
        setIsLiked(true);
        setLikeId(res.data[0].id);
      }
    });
  }, [user, song.id]);

  const toggleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (isLiked && likeId) {
      await likesService.remove(likeId);
      setIsLiked(false);
      setLikeId(null);
    } else {
      const res = await likesService.add(user.id, song.id);
      setIsLiked(true);
      setLikeId(res.data.id);
    }
  }, [isLiked, likeId, user, song.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index || 0) * 0.04 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => playSong(song, queue || [song])}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-colors"
      style={{
        background: isActive ? '#f2e8c7' : isHovered ? '#fbf3dd' : 'transparent',
      }}
    >
      {/* Index / Play indicator */}
      {showIndex && (
        <div className="w-6 text-center flex-shrink-0">
          {isActive && isPlaying ? (
            <div className="flex justify-center gap-0.5">
              {[1,2,3].map(i => (
                <div key={i} className="w-0.5 rounded-full animate-pulse-glow"
                  style={{
                    height: `${8 + i * 3}px`,
                    background: '#2c2c2c',
                    animationDelay: `${i * 0.15}s`
                  }} />
              ))}
            </div>
          ) : isHovered ? (
            <Play size={14} style={{ color: '#383318' }} className="mx-auto" />
          ) : (
            <span className="text-xs" style={{ color: '#bbb28f' }}>{(index || 0) + 1}</span>
          )}
        </div>
      )}

      {/* Cover */}
      <img
        src={song.cover}
        alt={song.title}
        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
      />

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1"
          style={{ color: isActive ? '#2c2c2c' : '#383318' }}>
          {song.title}
        </p>
        <p className="text-xs line-clamp-1" style={{ color: '#665f41' }}>
          {song.artist}
        </p>
      </div>

      {/* Album (hidden on small screens) */}
      <p className="hidden md:block text-xs line-clamp-1 w-32" style={{ color: '#827b5b' }}>
        {song.album}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={toggleLike}
          className="p-1.5 rounded-lg hover:bg-[#ede3bd] transition-colors"
        >
          <Heart
            size={14}
            style={{ color: isLiked ? '#9f403d' : '#827b5b' }}
            fill={isLiked ? '#9f403d' : 'none'}
          />
        </button>
        <button
          onClick={e => { e.stopPropagation(); addToQueue(song); }}
          className="p-1.5 rounded-lg hover:bg-[#ede3bd] transition-colors"
        >
          <Plus size={14} style={{ color: '#827b5b' }} />
        </button>
        {onAddToPlaylist && (
          <button
            onClick={e => { e.stopPropagation(); onAddToPlaylist(song); }}
            className="p-1.5 rounded-lg hover:bg-[#ede3bd] transition-colors"
          >
            <MoreHorizontal size={14} style={{ color: '#827b5b' }} />
          </button>
        )}
      </div>

      {/* Duration */}
      <span className="text-xs ml-2 flex-shrink-0" style={{ color: '#bbb28f' }}>
        {formatTime(song.duration)}
      </span>
    </motion.div>
  );
}
