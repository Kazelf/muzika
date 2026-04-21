import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, MoreHorizontal, Lock } from 'lucide-react';
import { Playlist, Song } from '../../types';
import { songsService } from '../../services/music.service';
import { usePlayer } from '../../contexts/PlayerContext';

interface PlaylistCardProps {
  playlist: Playlist;
  onEdit?: (playlist: Playlist) => void;
  onDelete?: (id: string) => void;
  index?: number;
}

export default function PlaylistCard({ playlist, onEdit, onDelete, index }: PlaylistCardProps) {
  const { playSong, setQueue } = usePlayer();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (playlist.songIds.length === 0) return;
    Promise.all(playlist.songIds.slice(0, 4).map(id => songsService.getById(id)))
      .then(results => setSongs(results.map(r => r.data)))
      .catch(() => {});
  }, [playlist.songIds]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (songs.length > 0) {
      setQueue(songs);
      playSong(songs[0], songs);
    }
  };

  const handleCardClick = () => {
    navigate(`/playlists/${playlist.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.06 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer card-hover p-3"
      style={{ background: '#fbf3dd' }}
      onClick={handleCardClick}
    >
      {/* Cover collage or single */}
      <div className="relative aspect-square mb-3 overflow-hidden rounded-xl">
        {songs.length >= 4 ? (
          <div className="grid grid-cols-2 w-full h-full">
            {songs.slice(0, 4).map(s => (
              <img key={s.id} src={s.cover} alt={s.title} className="w-full h-full object-cover" />
            ))}
          </div>
        ) : playlist.cover ? (
          <img src={playlist.cover} alt={playlist.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: '#ede3bd' }}>
            🎵
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100 transition-all"
          style={{ background: 'linear-gradient(to top, rgba(44,44,44,0.6) 0%, transparent 50%)' }}>
          <button onClick={handlePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-float transition-transform hover:scale-105"
            style={{ background: '#fff9ec' }}>
            <Play size={16} style={{ color: '#2c2c2c' }} className="ml-0.5" />
          </button>
        </div>

        {/* Auto badge */}
        {playlist.isAuto && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: '#486272', color: '#f4faff' }}>
            Tự động
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="flex items-center gap-1">
          {!playlist.isPublic && <Lock size={11} style={{ color: '#bbb28f' }} />}
          <p className="text-sm font-semibold line-clamp-1" style={{ color: '#383318' }}>
            {playlist.title}
          </p>
        </div>
        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: '#665f41' }}>
          {playlist.songIds.length} bài hát
        </p>
      </div>
    </motion.div>
  );
}
