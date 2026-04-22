import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Music, Heart, Clock } from 'lucide-react';
import { Song } from '../types';
import { songsService, likesService, historyService } from '../services/music.service';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import SongRow from '../components/song/SongRow';
import SongCard from '../components/song/SongCard';

const TABS = [
  { id: 'all', label: 'Tất Cả', icon: Music },
  { id: 'liked', label: 'Yêu Thích', icon: Heart },
  { id: 'recent', label: 'Nghe Gần Đây', icon: Clock },
] as const;

export default function Library() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'liked' | 'recent'>(
    tabParam as 'all' | 'liked' | 'recent'
  );
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const { currentSong } = usePlayer();

  useEffect(() => {
    const load = async () => {
      try {
        const songsRes = await songsService.getAll();
        setAllSongs(songsRes.data);

        if (user) {
          const [likesRes, historyRes] = await Promise.all([
            likesService.getByUser(user.id),
            historyService.getByUser(user.id),
          ]);

          const likedIds = new Set(likesRes.data.map((l: any) => l.songId));
          setLikedSongs(songsRes.data.filter((s: Song) => likedIds.has(s.id)));

          const seen = new Set<string>();
          const recent: Song[] = [];
          for (const h of historyRes.data) {
            if (!seen.has(h.songId)) {
              seen.add(h.songId);
              const s = songsRes.data.find((s: Song) => s.id === h.songId);
              if (s) recent.push(s);
            }
          }
          setRecentSongs(recent);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  // Update "Nghe Gần Đây" instantly when currentSong changes
  useEffect(() => {
    if (currentSong && !isLoading) {
      setRecentSongs(prev => {
        const filtered = prev.filter(s => s.id !== currentSong.id);
        return [currentSong, ...filtered];
      });
    }
  }, [currentSong?.id, isLoading]);

  const displaySongs = activeTab === 'liked' ? likedSongs
    : activeTab === 'recent' ? recentSongs
    : allSongs;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#383318' }}>Thư Viện</h1>
          <p className="text-sm mt-1" style={{ color: '#665f41' }}>
            {displaySongs.length} bài hát
          </p>
        </div>
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f2e8c7' }}>
          {(['list', 'grid'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: view === v ? '#2c2c2c' : 'transparent',
                color: view === v ? '#fff9ec' : '#665f41',
              }}
            >
              {v === 'list' ? '☰' : '⊞'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-3" style={{ borderColor: '#ede3bd' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSearchParams({ tab: id }); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: activeTab === id ? '#2c2c2c' : '#f2e8c7',
              color: activeTab === id ? '#fff9ec' : '#665f41',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
        </div>
      ) : displaySongs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎵</p>
          <p className="font-semibold text-lg" style={{ color: '#383318' }}>Chưa có bài hát nào</p>
          <p className="text-sm mt-2" style={{ color: '#665f41' }}>
            {activeTab === 'liked' ? 'Hãy thích một số bài hát để xem ở đây'
              : activeTab === 'recent' ? 'Bắt đầu nghe nhạc để xây dựng lịch sử của bạn'
              : 'Thư viện nhạc đang trống'}
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displaySongs.map((song, i) => (
            <SongCard key={song.id} song={song} queue={displaySongs} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fbf3dd' }}>
          {displaySongs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={displaySongs} />
          ))}
        </div>
      )}
    </div>
  );
}
