import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { searchService } from '../../services/music.service';
import { Song } from '../../types';
import { usePlayer } from '../../contexts/PlayerContext';
import { formatTime } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

const pageTitles: Record<string, string> = {
  '/': 'Khám Phá',
  '/search': 'Tìm Kiếm',
  '/library': 'Thư Viện',
  '/playlists': 'Playlist',
  '/stats': 'Thống Kê',
  '/social': 'Cộng Đồng',
  '/now-playing': 'Đang Phát',
  '/profile': 'Hồ Sơ',
};

export default function TopBar() {
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[location.pathname] || 'Muzika';

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchService.search(query);
        setResults(data.songs.slice(0, 5));
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSongSelect = (song: Song) => {
    playSong(song, results);
    setShowDropdown(false);
    setQuery('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowDropdown(false);
    }
  };

  return (
    <header className="fixed top-0 right-0 z-20 flex items-center justify-between px-6 py-4"
      style={{
        left: '14rem',
        background: 'rgba(255,249,236,0.85)',
        backdropFilter: 'blur(16px)',
      }}>

      {/* Page title (hidden on small, shown on lg) */}
      <h1 className="hidden lg:block text-lg font-bold" style={{ color: '#383318' }}>
        
      </h1>

      {/* Search bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-ghost"
            style={{ background: '#f2e8c7' }}>
            <Search size={16} style={{ color: '#827b5b' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm bài hát, nghệ sĩ, album..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#bbb28f]"
              style={{ color: '#383318' }}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setShowDropdown(false); }}>
                <X size={14} style={{ color: '#827b5b' }} />
              </button>
            )}
          </div>
        </form>

        {/* Dropdown suggestions */}
        <AnimatePresence>
          {showDropdown && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full mt-2 left-0 right-0 rounded-xl shadow-float overflow-hidden z-50"
              style={{ background: '#fff9ec' }}>
              {results.map(song => (
                <button
                  key={song.id}
                  onClick={() => handleSongSelect(song)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f6eed2] transition-colors text-left"
                >
                  <img src={song.cover} alt={song.title}
                    className="w-9 h-9 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-medium line-clamp-1" style={{ color: '#383318' }}>
                      {song.title}
                    </p>
                    <p className="text-xs" style={{ color: '#665f41' }}>
                      {song.artist} · {formatTime(song.duration)}
                    </p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(query)}`);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-sm text-center hover:bg-[#f6eed2] transition-colors border-t"
                style={{ color: '#486272', borderColor: '#ede3bd' }}
              >
                Xem tất cả kết quả cho "<strong>{query}</strong>"
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-[#f2e8c7] transition-colors">
          <Bell size={18} style={{ color: '#665f41' }} />
        </button>
        {user && (
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-9 h-9 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate('/profile')}
          />
        )}
      </div>
    </header>
  );
}
