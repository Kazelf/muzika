import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Playlist } from '../types';
import { playlistsService } from '../services/music.service';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import PlaylistCard from '../components/playlist/PlaylistCard';
import PlaylistModal from '../components/playlist/PlaylistModal';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Playlists() {
  const { user } = useAuth();
  const { playSong, setQueue } = usePlayer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');

  // Check for ?new=true on mount, then clear it
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowModal(true);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = user
        ? await playlistsService.getByUser(user.id)
        : await playlistsService.getPublic();
      setPlaylists(res.data);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa playlist này?')) return;
    await playlistsService.delete(id);
    setPlaylists(p => p.filter(pl => pl.id !== id));
    toast.success('Đã xóa playlist');
  };

  const handleOpenCreate = () => {
    setEditingPlaylist(null);
    setShowModal(true);
  };

  const handleOpenEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlaylist(null);
  };

  const handleSave = (saved: Playlist) => {
    setPlaylists(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = saved; return arr; }
      return [saved, ...prev];
    });
    handleCloseModal();
  };

  const myPlaylists = playlists.filter(p => p.userId === user?.id);
  const publicPlaylists = playlists.filter(p => p.isPublic && p.userId !== user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#383318' }}>Playlist</h1>
          <p className="text-sm mt-1" style={{ color: '#665f41' }}>
            Quản lý bộ sưu tập nhạc của bạn
          </p>
        </div>
        {user && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: '#2c2c2c', color: '#fff9ec' }}
          >
            <Plus size={16} />
            Tạo Playlist
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('my')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            background: activeTab === 'my' ? '#2c2c2c' : '#f2e8c7',
            color: activeTab === 'my' ? '#fff9ec' : '#665f41',
          }}
        >
          Của Tôi ({myPlaylists.length})
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            background: activeTab === 'public' ? '#2c2c2c' : '#f2e8c7',
            color: activeTab === 'public' ? '#fff9ec' : '#665f41',
          }}
        >
          Cộng Đồng
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 border-[#bbb28f] border-t-[#2c2c2c] animate-spin" />
        </div>
      ) : (
        <div>
          {activeTab === 'my' ? (
            <>
              {myPlaylists.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">🎵</p>
                  <p className="font-semibold text-lg" style={{ color: '#383318' }}>
                    Chưa có playlist nào
                  </p>
                  <p className="text-sm mt-2 mb-6" style={{ color: '#665f41' }}>
                    Tạo playlist đầu tiên của bạn ngay hôm nay
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="px-6 py-3 rounded-xl font-semibold"
                    style={{ background: '#2c2c2c', color: '#fff9ec' }}
                  >
                    Tạo Playlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {myPlaylists.map((pl, i) => (
                    <div key={pl.id} className="relative group">
                      <PlaylistCard
                        playlist={pl}
                        index={i}
                      />
                      {/* Quick actions overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={e => { e.stopPropagation(); handleOpenEdit(pl); }}
                          className="p-1.5 rounded-lg shadow-card"
                          style={{ background: '#fff9ec' }}
                        >
                          <Edit size={12} style={{ color: '#665f41' }} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(pl.id); }}
                          className="p-1.5 rounded-lg shadow-card"
                          style={{ background: '#fff9ec' }}
                        >
                          <Trash2 size={12} style={{ color: '#9f403d' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {publicPlaylists.map((pl, i) => (
                <PlaylistCard key={pl.id} playlist={pl} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PlaylistModal
          playlist={editingPlaylist}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
