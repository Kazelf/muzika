import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ListMusic, Check } from 'lucide-react';
import { Playlist, Song } from '../../types';
import { playlistsService } from '../../services/music.service';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AddToPlaylistModalProps {
  song: Song;
  onClose: () => void;
}

export default function AddToPlaylistModal({ song, onClose }: AddToPlaylistModalProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    playlistsService.getByUser(user.id).then(res => {
      setPlaylists(res.data);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, [user]);

  const handleAdd = async (playlist: Playlist) => {
    if (playlist.songIds.includes(song.id)) {
      toast.success('Bài hát đã có trong playlist này');
      return;
    }
    try {
      await playlistsService.addSong(playlist.id, song.id, playlist.songIds);
      toast.success(`Đã thêm vào ${playlist.title}`);
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleCreateNew = async () => {
    if (!user) return;
    try {
      const newPlaylist: Playlist = {
        id: `p${Date.now()}`,
        title: `Playlist mới`,
        description: '',
        cover: song.cover,
        userId: user.id,
        songIds: [song.id],
        isPublic: false,
        isAuto: false,
        playCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await playlistsService.create(newPlaylist);
      toast.success('Đã tạo playlist và thêm bài hát');
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden bg-surface"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-highest">
            <h3 className="font-bold text-lg text-on-surface">Thêm vào Playlist</h3>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <X size={18} color="#665f41" />
            </button>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-outline flex items-center justify-center shrink-0">
                <Plus size={20} color="#fff9ec" />
              </div>
              <span className="font-semibold text-on-surface">Tạo playlist mới</span>
            </button>

            {isLoading ? (
              <p className="text-center text-sm py-4 text-on-surface">Đang tải...</p>
            ) : (
              playlists.map(p => {
                const hasSong = p.songIds.includes(song.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAdd(p)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container transition-colors text-left"
                  >
                    <img src={p.cover} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface truncate">{p.title}</p>
                      <p className="text-xs text-on-surface">{p.songIds.length} bài hát</p>
                    </div>
                    {hasSong && <Check size={16} color="#486272" />}
                  </button>
                )
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
