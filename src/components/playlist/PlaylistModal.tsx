import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Lock, Globe, Image } from 'lucide-react';
import { Playlist } from '../../types';
import { playlistsService } from '../../services/music.service';
import { useAuth } from '../../contexts/AuthContext';
import { generateId } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
];

function getDefaultCover(): string {
  return DEFAULT_COVERS[Math.floor(Math.random() * DEFAULT_COVERS.length)];
}

interface PlaylistModalProps {
  playlist?: Playlist | null;
  onClose: () => void;
  onSave: (playlist: Playlist) => void;
}

export default function PlaylistModal({ playlist, onClose, onSave }: PlaylistModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(playlist?.title || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [coverUrl, setCoverUrl] = useState(playlist?.cover || '');
  const [isPublic, setIsPublic] = useState(playlist?.isPublic ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const previewCover = coverUrl.trim() || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setIsLoading(true);

    const finalCover = coverUrl.trim() || getDefaultCover();

    try {
      if (playlist) {
        // Update
        const res = await playlistsService.update(playlist.id, {
          title: title.trim(),
          description: description.trim(),
          cover: finalCover,
          isPublic,
          updatedAt: new Date().toISOString(),
        });
        onSave(res.data);
        toast.success('Đã cập nhật playlist');
      } else {
        // Create
        const newPlaylist: Omit<Playlist, 'id'> = {
          title: title.trim(),
          description: description.trim(),
          cover: finalCover,
          userId: user.id,
          songIds: [],
          isPublic,
          isAuto: false,
          mood: null,
          playCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const res = await playlistsService.create(newPlaylist);
        onSave(res.data);
        toast.success('Đã tạo playlist mới');
      }
    } catch {
      toast.error('Đã xảy ra lỗi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(56,51,24,0.4)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl shadow-float overflow-hidden max-h-[90vh] flex flex-col"
          style={{ background: '#fff9ec' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0"
            style={{ borderColor: '#ede3bd' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#2c2c2c' }}>
                <Music size={16} color="#fff9ec" />
              </div>
              <h2 className="font-bold text-lg" style={{ color: '#383318' }}>
                {playlist ? 'Sửa Playlist' : 'Tạo Playlist Mới'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#f2e8c7] transition-colors">
              <X size={18} style={{ color: '#665f41' }} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                Tên Playlist *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nhập tên playlist..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border-ghost"
                style={{ background: '#f2e8c7', color: '#383318' }}
                required
                maxLength={50}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả về playlist..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none border-ghost"
                style={{ background: '#f2e8c7', color: '#383318' }}
                maxLength={200}
              />
            </div>

            {/* Cover URL */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                <div className="flex items-center gap-1.5">
                  <Image size={14} />
                  Ảnh bìa (URL)
                </div>
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={e => { setCoverUrl(e.target.value); setCoverError(false); }}
                placeholder="https://example.com/image.jpg (để trống dùng ảnh mặc định)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border-ghost"
                style={{ background: '#f2e8c7', color: '#383318' }}
              />

              {/* Cover preview */}
              <div className="mt-3 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: '#ede3bd' }}>
                  {previewCover && !coverError ? (
                    <img
                      src={previewCover}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setCoverError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎵
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#665f41' }}>
                    {previewCover && !coverError
                      ? 'Xem trước ảnh bìa'
                      : coverError
                        ? 'URL ảnh không hợp lệ, sẽ dùng ảnh mặc định'
                        : 'Sẽ sử dụng ảnh mặc định'}
                  </p>
                </div>
              </div>
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all`}
                style={{
                  background: isPublic ? '#2c2c2c' : '#f2e8c7',
                  color: isPublic ? '#fff9ec' : '#665f41',
                }}
              >
                <Globe size={16} />
                Công khai
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all`}
                style={{
                  background: !isPublic ? '#2c2c2c' : '#f2e8c7',
                  color: !isPublic ? '#fff9ec' : '#665f41',
                }}
              >
                <Lock size={16} />
                Riêng tư
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: '#2c2c2c', color: '#fff9ec' }}
            >
              {isLoading ? 'Đang lưu...' : playlist ? 'Cập nhật' : 'Tạo Playlist'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
