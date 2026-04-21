import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Clock, Music, TrendingUp, Calendar } from 'lucide-react';
import { Song, ListenHistory } from '../types';
import { historyService, songsService } from '../services/music.service';
import { useAuth } from '../contexts/AuthContext';
import { formatMinutes, getDayLabel } from '../utils/helpers';

interface SongCount { song: Song; count: number; minutes: number; }

export default function Stats() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ListenHistory[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [topSongs, setTopSongs] = useState<SongCount[]>([]);
  const [genreStats, setGenreStats] = useState<{ genre: string; count: number; pct: number }[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; mins: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [histRes, songsRes] = await Promise.all([
          historyService.getByUser(user.id),
          songsService.getAll(),
        ]);
        const hist: ListenHistory[] = histRes.data;
        const songs: Song[] = songsRes.data;
        setHistory(hist);
        setAllSongs(songs);
        const songMap = new Map(songs.map(s => [s.id, s]));

        // Top songs
        const countMap = new Map<string, { count: number; minutes: number }>();
        hist.forEach(h => {
          const prev = countMap.get(h.songId) || { count: 0, minutes: 0 };
          countMap.set(h.songId, {
            count: prev.count + 1,
            minutes: prev.minutes + Math.floor(h.duration / 60),
          });
        });
        const top = Array.from(countMap.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([id, { count, minutes }]) => ({ song: songMap.get(id)!, count, minutes }))
          .filter(x => x.song);
        setTopSongs(top);

        // Genre distribution
        const genreMap = new Map<string, number>();
        hist.forEach(h => {
          const song = songMap.get(h.songId);
          if (!song) return;
          genreMap.set(song.genre, (genreMap.get(song.genre) || 0) + 1);
        });
        const total = hist.length || 1;
        const genres = Array.from(genreMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([genre, count]) => ({ genre, count, pct: Math.round((count / total) * 100) }));
        setGenreStats(genres);

        // Weekly activity (last 7 days)
        const now = new Date();
        const days: { day: string; mins: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayHist = hist.filter(h => {
            const hd = new Date(h.playedAt);
            return hd.toDateString() === d.toDateString();
          });
          const mins = dayHist.reduce((sum, h) => sum + Math.floor(h.duration / 60), 0);
          days.push({ day: getDayLabel(d), mins });
        }
        setWeeklyActivity(days);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const totalMinutes = history.reduce((sum, h) => sum + Math.floor(h.duration / 60), 0);
  const uniqueSongs = new Set(history.map(h => h.songId)).size;
  const maxMins = Math.max(...weeklyActivity.map(d => d.mins), 1);

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-5xl mb-4">📊</p>
        <p className="font-semibold text-xl" style={{ color: '#383318' }}>Đăng nhập để xem thống kê</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 rounded-full border-2 border-[#bbb28f] border-t-[#2c2c2c] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#383318' }}>Thống Kê</h1>
        <p className="text-sm mt-1" style={{ color: '#665f41' }}>Khám phá thói quen nghe nhạc của bạn</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng thời gian', value: formatMinutes(totalMinutes), icon: Clock, color: '#486272' },
          { label: 'Bài đã nghe', value: `${history.length}`, icon: Music, color: '#665f41' },
          { label: 'Bài duy nhất', value: `${uniqueSongs}`, icon: BarChart2, color: '#2c2c2c' },
          { label: 'Thể loại yêu thích', value: genreStats[0]?.genre || '—', icon: TrendingUp, color: '#9f403d' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-5 rounded-2xl"
            style={{ background: '#fbf3dd' }}
          >
            <Icon size={20} style={{ color }} className="mb-3" />
            <p className="text-2xl font-bold" style={{ color: '#383318' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: '#827b5b' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Activity Chart */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} style={{ color: '#486272' }} />
          <h2 className="font-bold" style={{ color: '#383318' }}>Hoạt Động 7 Ngày Qua</h2>
        </div>
        <div className="p-6 rounded-2xl" style={{ background: '#fbf3dd' }}>
          <div className="flex items-end gap-3 h-32">
            {weeklyActivity.map(({ day, mins }, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${maxMins > 0 ? (mins / maxMins) * 100 : 0}%`,
                    minHeight: mins > 0 ? '4px' : '0',
                    background: '#2c2c2c',
                    maxHeight: '100px',
                  }} />
                <span className="text-xs" style={{ color: '#bbb28f' }}>{day}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Songs */}
      {topSongs.length > 0 && (
        <section>
          <h2 className="font-bold mb-4" style={{ color: '#383318' }}>🏆 Top Bài Hát Của Bạn</h2>
          <div className="space-y-3">
            {topSongs.map(({ song, count, minutes }, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: '#fbf3dd' }}
              >
                <span className="text-lg font-bold w-6" style={{ color: '#bbb28f' }}>
                  #{i + 1}
                </span>
                <img src={song.cover} alt={song.title}
                  className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1" style={{ color: '#383318' }}>{song.title}</p>
                  <p className="text-sm" style={{ color: '#665f41' }}>{song.artist}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: '#383318' }}>{count} lần</p>
                  <p className="text-xs" style={{ color: '#bbb28f' }}>{minutes} phút</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Genre Distribution */}
      {genreStats.length > 0 && (
        <section>
          <h2 className="font-bold mb-4" style={{ color: '#383318' }}>🎸 Thể Loại Yêu Thích</h2>
          <div className="space-y-3 p-5 rounded-2xl" style={{ background: '#fbf3dd' }}>
            {genreStats.map(({ genre, count, pct }, i) => (
              <div key={genre} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#383318' }}>{genre}</span>
                  <span style={{ color: '#bbb28f' }}>{count} lần · {pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#ede3bd' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: '#2c2c2c' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
