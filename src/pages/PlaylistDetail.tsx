import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Play, Shuffle, Clock, Music, Trash2,
  Plus, Globe, Lock
} from 'lucide-react';
import { Playlist, Song } from '../types';
import { playlistsService, songsService } from '../services/music.service';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { formatTime } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSong, setQueue, currentSong, isPlaying, togglePlay } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSongs, setShowAddSongs] = useState(false);

  const isOwner = playlist?.userId === user?.id;

  useEffect(() => {
    if (!id) return;
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const plRes = await playlistsService.getById(id);
      setPlaylist(plRes.data);

      // Load songs in playlist
      if (plRes.data.songIds.length > 0) {
        const songResults = await Promise.all(
          plRes.data.songIds.map((sid: string) =>
            songsService.getById(sid).catch(() => null)
          )
        );
        setSongs(songResults.filter(Boolean).map(r => r!.data));
      } else {
        setSongs([]);
      }
    } catch {
      toast.error('Không thể tải playlist');
      navigate('/playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllSongs = async () => {
    const res = await songsService.getAll();
    setAllSongs(res.data);
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    setQueue(songs);
    playSong(songs[0], songs);
  };

  const handleShufflePlay = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    playSong(shuffled[0], shuffled);
  };

  const handlePlaySong = (song: Song) => {
    playSong(song, songs);
  };

  const handleRemoveSong = async (songId: string) => {
    if (!playlist || !isOwner) return;
    const newSongIds = playlist.songIds.filter(s => s !== songId);
    try {
      await playlistsService.removeSong(playlist.id, songId, playlist.songIds);
      setPlaylist({ ...playlist, songIds: newSongIds });
      setSongs(songs.filter(s => s.id !== songId));
      toast.success('Đã xóa bài hát khỏi playlist');
    } catch {
      toast.error('Không thể xóa bài hát');
    }
  };

  const handleAddSong = async (songId: string) => {
    if (!playlist || !isOwner) return;
    if (playlist.songIds.includes(songId)) {
      toast.error('Bài hát đã có trong playlist');
      return;
    }
    try {
      await playlistsService.addSong(playlist.id, songId, playlist.songIds);
      const songRes = await songsService.getById(songId);
      setPlaylist({ ...playlist, songIds: [...playlist.songIds, songId] });
      setSongs([...songs, songRes.data]);
      toast.success('Đã thêm bài hát vào playlist');
    } catch {
      toast.error('Không thể thêm bài hát');
    }
  };

  const totalDuration = songs.reduce((acc, s) => acc + s.duration, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[#bbb28f] border-t-[#2c2c2c] animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">😔</p>
        <p className="font-semibold text-lg" style={{ color: '#383318' }}>
          Không tìm thấy playlist
        </p>
        <button onClick={() => navigate('/playlists')}
          className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#2c2c2c', color: '#fff9ec' }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  const availableSongs = allSongs.filter(s => !playlist.songIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/playlists')}
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: '#665f41' }}
      >
        <ArrowLeft size={16} />
        Quay lại Playlists
      </button>

      {/* Playlist Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-6 items-start"
      >
        {/* Cover */}
        <div className="w-48 h-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg">
          {songs.length >= 4 ? (
            <div className="grid grid-cols-2 w-full h-full">
              {songs.slice(0, 4).map(s => (
                <img key={s.id} src={s.cover} alt={s.title}
                  className="w-full h-full object-cover" />
              ))}
            </div>
          ) : playlist.cover ? (
            <img src={playlist.cover} alt={playlist.title}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl"
              style={{ background: '#ede3bd' }}>
              🎵
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {playlist.isPublic ? (
              <Globe size={14} style={{ color: '#665f41' }} />
            ) : (
              <Lock size={14} style={{ color: '#665f41' }} />
            )}
            <span className="text-xs font-medium" style={{ color: '#665f41' }}>
              {playlist.isPublic ? 'Playlist công khai' : 'Playlist riêng tư'}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-2" style={{ color: '#383318' }}>
            {playlist.title}
          </h1>

          {playlist.description && (
            <p className="text-sm mb-3" style={{ color: '#665f41' }}>
              {playlist.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs mb-5" style={{ color: '#bbb28f' }}>
            <span className="flex items-center gap-1">
              <Music size={12} />
              {songs.length} bài hát
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatTime(totalDuration)}
            </span>
            {playlist.playCount > 0 && (
              <>
                <span>•</span>
                <span>{playlist.playCount} lượt phát</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: '#2c2c2c', color: '#fff9ec' }}
            >
              <Play size={16} className="ml-0.5" />
              Phát tất cả
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={songs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: '#f2e8c7', color: '#383318' }}
            >
              <Shuffle size={16} />
              Trộn bài
            </button>

            {isOwner && (
              <button
                onClick={() => {
                  if (allSongs.length === 0) loadAllSongs();
                  setShowAddSongs(!showAddSongs);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{ background: '#f2e8c7', color: '#383318' }}
              >
                <Plus size={16} />
                Thêm bài hát
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Song List */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: '#383318' }}>
          Danh sách bài hát
        </h2>

        {songs.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#fbf3dd' }}>
            <p className="text-4xl mb-3">🎵</p>
            <p className="font-semibold" style={{ color: '#383318' }}>
              Playlist trống
            </p>
            <p className="text-sm mt-1" style={{ color: '#665f41' }}>
              {isOwner ? 'Thêm bài hát vào playlist của bạn' : 'Chưa có bài hát nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, index) => {
              const isCurrentSong = currentSong?.id === song.id;
              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: isCurrentSong ? '#f2e8c7' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isCurrentSong) e.currentTarget.style.background = '#fbf3dd';
                  }}
                  onMouseLeave={e => {
                    if (!isCurrentSong) e.currentTarget.style.background = 'transparent';
                  }}
                  onClick={() => handlePlaySong(song)}
                >
                  {/* Index / Play icon */}
                  <div className="w-8 text-center flex-shrink-0">
                    {isCurrentSong && isPlaying ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 rounded-full animate-pulse" style={{ background: '#486272' }} />
                        <span className="w-0.5 h-4 rounded-full animate-pulse" style={{ background: '#486272', animationDelay: '0.15s' }} />
                        <span className="w-0.5 h-2 rounded-full animate-pulse" style={{ background: '#486272', animationDelay: '0.3s' }} />
                      </div>
                    ) : (
                      <span className="text-sm font-medium group-hover:hidden" style={{ color: '#bbb28f' }}>
                        {index + 1}
                      </span>
                    )}
                    <Play
                      size={14}
                      className="hidden group-hover:block mx-auto"
                      style={{ color: '#383318' }}
                    />
                  </div>

                  {/* Cover */}
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />

                  {/* Song info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: isCurrentSong ? '#486272' : '#383318' }}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#665f41' }}>
                      {song.artist}
                    </p>
                  </div>

                  {/* Album */}
                  <p className="hidden md:block text-xs truncate w-40" style={{ color: '#bbb28f' }}>
                    {song.album}
                  </p>

                  {/* Duration */}
                  <span className="text-xs tabular-nums" style={{ color: '#bbb28f' }}>
                    {formatTime(song.duration)}
                  </span>

                  {/* Remove button (owner only) */}
                  {isOwner && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveSong(song.id);
                      }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      title="Xóa khỏi playlist"
                    >
                      <Trash2 size={14} style={{ color: '#9f403d' }} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Songs Panel */}
      {showAddSongs && isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: '#fbf3dd' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#383318' }}>
              Thêm bài hát
            </h3>
            <button
              onClick={() => setShowAddSongs(false)}
              className="text-sm font-medium px-3 py-1 rounded-lg transition-colors"
              style={{ color: '#665f41' }}
            >
              Đóng
            </button>
          </div>

          {availableSongs.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#665f41' }}>
              {allSongs.length === 0 ? 'Đang tải...' : 'Tất cả bài hát đã được thêm vào playlist'}
            </p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {availableSongs.map(song => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer hover:bg-[#f2e8c7]"
                >
                  <img src={song.cover} alt={song.title}
                    className="w-9 h-9 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#383318' }}>
                      {song.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#665f41' }}>
                      {song.artist}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: '#bbb28f' }}>
                    {formatTime(song.duration)}
                  </span>
                  <button
                    onClick={() => handleAddSong(song.id)}
                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                    style={{ background: '#2c2c2c' }}
                    title="Thêm vào playlist"
                  >
                    <Plus size={14} color="#fff9ec" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
