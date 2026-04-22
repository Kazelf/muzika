import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Music, Trash2, KeyRound, Edit2, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Song } from '../../types';
import { usersService, songsService } from '../../services/music.service';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'songs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSongModal, setShowSongModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Song Form
  const [songForm, setSongForm] = useState<Partial<Song>>({
    title: '', artist: '', cover: '', url: '', duration: 0, genre: '', mood: 'calm'
  });
  const [lyricsInput, setLyricsInput] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        usersService.getAll(),
        songsService.getAll()
      ]);
      setUsers(uRes.data);
      setSongs(sRes.data);
    } catch {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      toast.success('Đã xóa người dùng');
    } catch {
      toast.error('Lỗi khi xóa người dùng');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.patch(`/users/${selectedUser.id}`, { password: newPassword });
      toast.success(`Đã đổi mật khẩu cho ${selectedUser.username}`);
      setShowPasswordModal(false);
      setNewPassword('');
    } catch {
      toast.error('Lỗi khi đổi mật khẩu');
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài hát này?')) return;
    try {
      await api.delete(`/songs/${id}`);
      setSongs(songs.filter(s => s.id !== id));
      toast.success('Đã xóa bài hát');
    } catch {
      toast.error('Lỗi khi xóa bài hát');
    }
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let audioUrl = songForm.url;
      if (audioFile) {
        toast.loading('Đang tải lên âm thanh...', { id: 'upload' });
        const uploadRes = await songsService.uploadAudio(audioFile);
        audioUrl = uploadRes.data.url;
        if (uploadRes.data.lyrics) {
          setLyricsInput(uploadRes.data.lyrics);
        }
        toast.success('Tải lên hoàn tất', { id: 'upload' });
      } else if (!songForm.url) {
        toast.error('Vui lòng chọn file âm thanh!');
        setIsUploading(false);
        return;
      }

      const finalForm = { ...songForm, url: audioUrl };

      // Parse lyrics
      let parsedLyrics = [{ time: 0, text: "🎵 Instrumental" }];
      if (lyricsInput.trim()) {
        const lines = lyricsInput.split('\n');
        const temp = [];
        let lastTime = 0;
        for (const line of lines) {
          if (!line.trim()) continue;
          const match = line.match(/\[(\d+):(\d+\.?\d*)\](.*)/);
          if (match) {
            const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
            temp.push({ time, text: match[3].trim() });
            lastTime = time;
          } else {
            // Simple text line
            temp.push({ time: lastTime + 2, text: line.trim() });
            lastTime += 2;
          }
        }
        if (temp.length > 0) parsedLyrics = temp;
      }

      if (selectedSong) {
        // Update
        const res = await api.patch(`/songs/${selectedSong.id}`, { ...finalForm, lyrics: parsedLyrics });
        setSongs(songs.map(s => s.id === selectedSong.id ? res.data : s));
        toast.success('Đã cập nhật bài hát');
      } else {
        // Create
        const newSong = {
          ...finalForm,
          id: `s${Date.now()}`,
          artistId: 'a1',
          albumId: 'al1',
          album: 'Single',
          lyrics: parsedLyrics,
          playCount: 0,
          trending: false,
          year: new Date().getFullYear(),
          createdAt: new Date().toISOString()
        };
        const res = await api.post(`/songs`, newSong);
        setSongs([...songs, res.data]);
        toast.success('Đã thêm bài hát mới');
      }
      setShowSongModal(false);
      setAudioFile(null);
    } catch {
      toast.error('Lỗi khi lưu bài hát', { id: 'upload' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFetchLyrics = async () => {
    if (!songForm.title || !songForm.artist) {
      toast.error('Vui lòng nhập tên bài hát và ca sĩ trước!');
      return;
    }
    setIsFetchingLyrics(true);
    toast.loading('Đang tìm kiếm lời bài hát...', { id: 'fetch-lyrics' });
    try {
      const query = new URLSearchParams({
        track_name: songForm.title,
        artist_name: songForm.artist
      });
      const res = await fetch(`https://lrclib.net/api/search?${query.toString()}`);
      const data = await res.json();
      if (data && data.length > 0 && data[0].syncedLyrics) {
        setLyricsInput(data[0].syncedLyrics);
        toast.success('Đã tìm thấy lời bài hát đồng bộ!', { id: 'fetch-lyrics' });
      } else if (data && data.length > 0 && data[0].plainLyrics) {
        setLyricsInput(data[0].plainLyrics);
        toast.success('Chỉ tìm thấy lời văn bản (chưa đồng bộ thời gian).', { id: 'fetch-lyrics' });
      } else {
        toast.error('Không tìm thấy lời bài hát nào.', { id: 'fetch-lyrics' });
      }
    } catch {
      toast.error('Lỗi khi kết nối đến máy chủ tìm kiếm.', { id: 'fetch-lyrics' });
    } finally {
      setIsFetchingLyrics(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-secondary">
          <ShieldCheck size={28} color="#fff9ec" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Quản Trị Hệ Thống</h1>
          <p className="text-sm" style={{ color: '#665f41' }}>Quản lý người dùng và nội dung bài hát</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: '#ede3bd' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-medium flex items-center gap-2 ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-primary'}`}
        >
          <Users size={18} /> Người Dùng
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`pb-3 font-medium flex items-center gap-2 ${activeTab === 'songs' ? 'text-primary border-b-2 border-primary' : 'text-primary'}`}
        >
          <Music size={18} /> Bài Hát
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary" style={{ color: '#fff9ec' }}>
              <tr>
                <th className="px-6 py-4 font-semibold rounded-tl-2xl">Người dùng</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Vai trò</th>
                <th className="px-6 py-4 font-semibold text-right rounded-tr-2xl">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold text-primary">{u.displayName}</p>
                      <p className="text-xs text-primary">@{u.username}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4" style={{ color: '#383318' }}>{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: u.role === 'admin' ? '#2c2c2c' : '#d0ecff', color: u.role === 'admin' ? '#fff9ec' : '#486272' }}>
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => { setSelectedUser(u); setShowPasswordModal(true); }}
                      className="p-2 bg-tertiary-container text-tertiary rounded-lg hover:opacity-80"
                      title="Đổi mật khẩu"
                    >
                      <KeyRound size={16} />
                    </button>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 bg-[#ffdedd] text-error rounded-lg hover:opacity-80"
                        title="Xóa người dùng"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setSelectedSong(null);
                setSongForm({ title: '', artist: '', cover: '', url: '', duration: 200, genre: 'Pop', mood: 'happy' });
                setLyricsInput('');
                setAudioFile(null);
                setShowSongModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            > 
              <Plus size={18} /> Thêm Bài Hát
            </button>
          </div>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 font-semibold rounded-tl-2xl">Bài hát</th>
                  <th className="px-6 py-4 font-semibold">Ca sĩ</th>
                  <th className="px-6 py-4 font-semibold">Thể loại</th>
                  <th className="px-6 py-4 font-semibold text-right rounded-tr-2xl">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {songs.map(s => (
                  <tr key={s.id} className="transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={s.cover} alt={s.title} className="w-10 h-10 rounded-lg object-cover" />
                      <p className="font-semibold line-clamp-1 text-primary">{s.title}</p>
                    </td>
                    <td className="px-6 py-4 text-primary">{s.artist}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-surface-container-highest rounded-full text-xs" style={{ color: '#665f41' }}>{s.genre}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => { 
                          setSelectedSong(s); 
                          setSongForm(s); 
                          setAudioFile(null);
                          // Convert lyrics to LRC
                          let lrc = '';
                          if (s.lyrics && s.lyrics[0]?.text !== "🎵 Instrumental") {
                            lrc = s.lyrics.map(l => {
                              const mins = Math.floor(l.time / 60).toString().padStart(2, '0');
                              const secs = (l.time % 60).toFixed(2).padStart(5, '0');
                              return `[${mins}:${secs}] ${l.text}`;
                            }).join('\n');
                          }
                          setLyricsInput(lrc);
                          setShowSongModal(true); 
                        }}
                        className="p-2 bg-[#e6f4ea] text-[#2e7d32] rounded-lg hover:opacity-80"
                        title="Sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSong(s.id)}
                        className="p-2 bg-[#ffdedd] text-error rounded-lg hover:opacity-80"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-2xl p-6 shadow-xl relative bg-[#fff9ec]">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 hover:bg-surface-container-high rounded-full"><X size={20} color="#665f41" /></button>
            <h3 className="text-xl font-bold mb-4 text-primary">Đổi mật khẩu</h3>
            <p className="text-sm mb-4 text-on-surface-variant">Đang đổi mật khẩu cho user: <strong>{selectedUser.username}</strong></p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới..." className="w-full px-4 py-3 rounded-xl bg-surface-container-high outline-none" required minLength={6} />
              <button type="submit" className="w-full py-3 bg-secondary text-[#fff9ec] rounded-xl font-bold">Lưu thay đổi</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Song Modal */}
      {showSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl p-6 shadow-xl relative bg-[#fff9ec] max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowSongModal(false)} className="absolute top-4 right-4 p-2 hover:bg-surface-container-high rounded-full"><X size={20} color="#665f41" /></button>
            <h3 className="text-xl font-bold mb-6 text-primary">{selectedSong ? 'Sửa Bài Hát' : 'Thêm Bài Hát Mới'}</h3>
            <form onSubmit={handleSaveSong} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên bài hát</label>
                <input type="text" value={songForm.title} onChange={e => setSongForm({...songForm, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ca sĩ</label>
                <input type="text" value={songForm.artist} onChange={e => setSongForm({...songForm, artist: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Cover (Ảnh)</label>
                <input type="url" value={songForm.cover} onChange={e => setSongForm({...songForm, cover: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">File Âm thanh (MP3)</label>
                <input type="file" accept="audio/*" onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setAudioFile(e.target.files[0]);
                  }
                }} className="w-full px-4 py-2 rounded-xl bg-surface-container-high outline-none text-sm" />
                {songForm.url && !audioFile && <p className="text-xs text-on-surface-variant mt-1">Đang dùng file cũ: {songForm.url}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thể loại</label>
                  <input type="text" value={songForm.genre} onChange={e => setSongForm({...songForm, genre: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thời lượng (giây)</label>
                  <input type="number" value={songForm.duration} onChange={e => setSongForm({...songForm, duration: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high outline-none" required />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Lời bài hát</label>
                  <button 
                    type="button" 
                    onClick={handleFetchLyrics}
                    disabled={isFetchingLyrics}
                    className="text-xs bg-primary text-surface px-2 py-1 rounded-md hover:opacity-80 disabled:opacity-50"
                  >
                    {isFetchingLyrics ? 'Đang tìm...' : 'Tự động tìm lời'}
                  </button>
                </div>
                <textarea 
                  value={lyricsInput} 
                  onChange={e => setLyricsInput(e.target.value)} 
                  placeholder="[00:10.00] Dòng lời thứ nhất&#10;[00:15.50] Dòng lời thứ hai"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high outline-none h-24 resize-none" 
                />
              </div>
              <button type="submit" disabled={isUploading} className="w-full py-3 bg-secondary text-[#fff9ec] rounded-xl font-bold mt-4 disabled:opacity-50">
                {isUploading ? 'Đang lưu...' : 'Lưu Bài Hát'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
