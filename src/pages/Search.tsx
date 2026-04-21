import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, Music, User, Album } from 'lucide-react';
import { SearchResults } from '../types';
import { searchService } from '../services/music.service';
import SongRow from '../components/song/SongRow';
import { motion } from 'framer-motion';
import { usePlayer } from '../contexts/PlayerContext';

const GENRES = ['Acoustic', 'Jazz', 'Electronic', 'Classical', 'Ambient', 'Rock', 'Pop', 'Folk'];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'playlists'>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { playSong } = usePlayer();

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchService.search(query);
        setResults(data);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const totalResults = results
    ? results.songs.length + results.artists.length + results.albums.length
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#383318' }}>Tìm Kiếm</h1>

        {/* Search input */}
        <div className="relative max-w-xl">
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{ background: '#f2e8c7' }}>
            <SearchIcon size={20} style={{ color: '#827b5b' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tên bài hát, nghệ sĩ, album, genre..."
              className="flex-1 bg-transparent text-base outline-none"
              style={{ color: '#383318' }}
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X size={16} style={{ color: '#827b5b' }} />
              </button>
            )}
          </div>
          {query && (
            <p className="mt-2 text-xs" style={{ color: '#bbb28f' }}>
              💡 Mẹo: Có thể gõ sai chính tả — chúng tôi vẫn tìm được!
            </p>
          )}
        </div>
      </div>

      {/* No query: show genres */}
      {!query && (
        <section>
          <h2 className="text-base font-bold mb-4" style={{ color: '#383318' }}>
            Duyệt theo thể loại
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {GENRES.map((genre, i) => {
              const colors = [
                ['#d0ecff', '#486272'], ['#ede3bd', '#665f41'],
                ['#f2e8c7', '#827b5b'], ['#e4e2e1', '#535252'],
                ['#e3e2e7', '#5b5b60'], ['#fe8983', '#752121'],
                ['#f6eed2', '#383318'], ['#d6d4d3', '#3f3f3f'],
              ];
              const [bg, text] = colors[i % colors.length];
              return (
                <button
                  key={genre}
                  onClick={() => setQuery(genre)}
                  className="p-5 rounded-2xl text-left font-bold text-lg card-hover"
                  style={{ background: bg, color: text }}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Searching indicator */}
      {isSearching && (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#bbb28f] border-t-[#2c2c2c] animate-spin" />
          <p className="text-sm" style={{ color: '#665f41' }}>Đang tìm kiếm...</p>
        </div>
      )}

      {/* Results */}
      {results && !isSearching && (
        <div className="space-y-6">
          {/* Stats */}
          <p className="text-sm" style={{ color: '#665f41' }}>
            Tìm thấy <strong>{totalResults}</strong> kết quả cho "<strong>{query}</strong>"
          </p>

          {/* Tabs */}
          <div className="flex gap-2">
            {(['all', 'songs', 'artists', 'playlists'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: activeTab === tab ? '#2c2c2c' : '#f2e8c7',
                  color: activeTab === tab ? '#fff9ec' : '#665f41',
                }}
              >
                {tab === 'all' ? 'Tất cả' : tab === 'songs' ? `Bài hát (${results.songs.length})` :
                  tab === 'artists' ? `Nghệ sĩ (${results.artists.length})` :
                  `Playlist (${results.playlists.length})`}
              </button>
            ))}
          </div>

          {/* Songs */}
          {(activeTab === 'all' || activeTab === 'songs') && results.songs.length > 0 && (
            <section>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#383318' }}>
                <Music size={16} /> Bài Hát
              </h3>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#fbf3dd' }}>
                {results.songs.map((song, i) => (
                  <SongRow key={song.id} song={song} index={i} queue={results.songs} />
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
            <section>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#383318' }}>
                <User size={16} /> Nghệ Sĩ
              </h3>
              <div className="flex flex-wrap gap-3">
                {results.artists.map(artist => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl card-hover cursor-pointer"
                    style={{ background: '#fbf3dd' }}
                  >
                    <img src={artist.avatar} alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#383318' }}>{artist.name}</p>
                      <p className="text-xs" style={{ color: '#665f41' }}>{artist.genre.join(' · ')}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {(activeTab === 'all') && results.albums.length > 0 && (
            <section>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#383318' }}>
                <Album size={16} /> Album
              </h3>
              <div className="flex flex-wrap gap-3">
                {results.albums.map(album => (
                  <div key={album.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl card-hover cursor-pointer"
                    style={{ background: '#fbf3dd' }}>
                    <img src={album.cover} alt={album.title}
                      className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#383318' }}>{album.title}</p>
                      <p className="text-xs" style={{ color: '#665f41' }}>{album.genre} · {album.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {totalResults === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold" style={{ color: '#383318' }}>
                Không tìm thấy kết quả nào
              </p>
              <p className="text-sm mt-1" style={{ color: '#665f41' }}>
                Thử từ khóa khác hoặc kiểm tra lại chính tả
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
