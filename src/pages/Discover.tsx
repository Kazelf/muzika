import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { Song, Recommendation } from '../types';
import { songsService, historyService, likesService } from '../services/music.service';
import { getRecommendations, getMoodRecommendations, getMoodLabel, getMoodEmoji } from '../utils/recommendation';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import SongCard from '../components/song/SongCard';
import SongRow from '../components/song/SongRow';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../utils/helpers';

const MOODS = ['calm', 'energetic', 'happy', 'sad', 'romantic'] as const;

export default function Discover() {
  const { user } = useAuth();
  const { playSong, currentSong } = usePlayer();
  const navigate = useNavigate();
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [recent, setRecent] = useState<Song[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodSongs, setMoodSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  useEffect(() => {
    const load = async () => {
      try {
        const [songsRes, trendingRes] = await Promise.all([
          songsService.getAll(),
          songsService.getTrending(),
        ]);
        setAllSongs(songsRes.data);
        // trendingRes from API is already sorted by playCount descending
        setTrending(trendingRes.data.slice(0, 6));

        if (user) {
          const historyRes = await historyService.getByUser(user.id);
          
          // Recent: get unique songs from history ordered strictly by the most recent playedAt
          // historyRes is already sorted by playedAt desc by the API
          const seen = new Set<string>();
          const recentSongs: Song[] = [];
          for (const h of historyRes.data) {
            if (!seen.has(h.songId)) {
              seen.add(h.songId);
              const s = songsRes.data.find((s: Song) => s.id === h.songId);
              if (s) recentSongs.push(s);
              if (recentSongs.length >= 5) break;
            }
          }
          setRecent(recentSongs);
        } else {
          // Not logged in: show some songs as recent
          setRecent(songsRes.data.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  // Recommendations based on current song tag (genre)
  useEffect(() => {
    if (currentSong && allSongs.length > 0) {
      const tag = currentSong.genre;
      const recs = allSongs
        .filter(s => s.genre === tag && s.id !== currentSong.id)
        .slice(0, 6)
        .map(song => ({
          song,
          score: 1,
          reason: `Cùng thể loại ${tag}`
        }));
      setRecommendations(recs);
    } else if (!currentSong && allSongs.length > 0 && user) {
      // Fallback if no song is playing (fetch based on history as before)
      historyService.getByUser(user.id).then(historyRes => {
        likesService.getByUser(user.id).then(likesRes => {
          const likedIds = likesRes.data.map((l: any) => l.songId);
          const recs = getRecommendations(historyRes.data, allSongs, likedIds, 6);
          setRecommendations(recs);
        });
      });
    }
  }, [currentSong, allSongs, user]);

  // Update "Nghe gần đây" instantly when currentSong changes
  useEffect(() => {
    if (currentSong && !isLoading) {
      setRecent(prev => {
        const filtered = prev.filter(s => s.id !== currentSong.id);
        return [currentSong, ...filtered].slice(0, 5);
      });
    }
  }, [currentSong?.id, isLoading]);

  useEffect(() => {
    if (!selectedMood) { setMoodSongs([]); return; }
    const moods = getMoodRecommendations(selectedMood, allSongs, 6);
    setMoodSongs(moods.map(r => r.song));
  }, [selectedMood, allSongs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full animate-spin border-2 border-outline-variant border-t-primary mx-auto mb-3" />
          <p className="text-sm" style={{ color: '#665f41' }}>Đang tải nhạc...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header greeting */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium mb-1" style={{ color: '#827b5b' }}>
          {greeting}, {user?.displayName || 'người yêu nhạc'} 👋
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#383318' }}>
          Khám Phá Nhạc Hôm Nay
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#665f41' }}>
          Những giai điệu được chọn lọc dành riêng cho bạn
        </p>
      </motion.div>

      {/* Mood selector */}
      <section>
        <h2 className="text-base font-bold mb-4" style={{ color: '#383318' }}>
          🎭 Tâm Trạng Hôm Nay
        </h2>
        <div className="flex gap-3 flex-wrap">
          {MOODS.map(mood => (
            <button
              key={mood}
              onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: selectedMood === mood ? '#2c2c2c' : '#f2e8c7',
                color: selectedMood === mood ? '#fff9ec' : '#665f41',
              }}
            >
              <span>{getMoodEmoji(mood)}</span>
              <span>{getMoodLabel(mood)}</span>
            </button>
          ))}
        </div>
        {moodSongs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          >
            {moodSongs.map((song, i) => (
              <SongCard key={song.id} song={song} queue={moodSongs} index={i} />
            ))}
          </motion.div>
        )}
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: '#383318' }}>
              ✨ Gợi Ý Cho Bạn
            </h2>
            <button onClick={() => navigate('/search')}
              className="flex items-center gap-1 text-sm" style={{ color: '#486272' }}>
              Xem thêm <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recommendations.map((rec, i) => (
              <div key={rec.song.id} className="relative">
                <SongCard song={rec.song} queue={recommendations.map(r => r.song)} index={i} />
                <p className="text-xs mt-1 px-1 line-clamp-1" style={{ color: '#bbb28f' }}>
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} style={{ color: '#9f403d' }} />
            <h2 className="text-base font-bold" style={{ color: '#383318' }}>Đang Thịnh Hành</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {trending.map((song, i) => (
            <SongCard key={song.id} song={song} queue={trending} index={i} />
          ))}
        </div>
      </section>

      {/* Recently Played */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: '#486272' }} />
            <h2 className="text-base font-bold" style={{ color: '#383318' }}>Nghe Gần Đây</h2>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fbf3dd' }}>
          {recent.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={recent} />
          ))}
        </div>
      </section>
    </div>
  );
}
