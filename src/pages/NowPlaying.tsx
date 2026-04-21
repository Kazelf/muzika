import { useEffect, useState, useRef } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, MoreHorizontal, Shuffle, Minimize2 } from 'lucide-react';
import { formatTime } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { likesService } from '../services/music.service';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'lyrics' | 'queue';

export default function NowPlaying() {
  const {
    currentSong, isPlaying, currentTime, duration,
    togglePlay, playNext, playPrev, seekTo,
    queue, isShuffle, toggleShuffle, playSong,
    toggleMiniPlayer
  } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('lyrics');
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState<string | null>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !currentSong) return;
    likesService.check(user.id, currentSong.id).then(res => {
      setIsLiked(res.data.length > 0);
      if (res.data.length > 0) setLikeId(res.data[0].id);
    });
  }, [user, currentSong?.id]);

  // Auto-scroll lyrics
  useEffect(() => {
    if (!currentSong || !lyricsRef.current) return;
    const activeLine = lyricsRef.current.querySelector('.lyric-line.active');
    if (activeLine) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime]);

  const toggleLike = async () => {
    if (!user || !currentSong) return;
    if (isLiked && likeId) {
      await likesService.remove(likeId);
      setIsLiked(false); setLikeId(null);
    } else {
      const res = await likesService.add(user.id, currentSong.id);
      setIsLiked(true); setLikeId(res.data.id);
    }
  };

  if (!currentSong) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center">
        <p className="text-6xl mb-4">🎵</p>
        <p className="font-semibold text-xl" style={{ color: '#383318' }}>Chưa có bài hát nào đang phát</p>
        <p className="text-sm mt-2" style={{ color: '#665f41' }}>Chọn một bài hát để bắt đầu nghe</p>
        <button onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 rounded-xl font-semibold"
          style={{ background: '#2c2c2c', color: '#fff9ec' }}>
          Khám Phá Nhạc
        </button>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get active lyric
  const activeLyricIdx = currentSong.lyrics.reduce((acc, line, i) => {
    return currentTime >= line.time ? i : acc;
  }, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
      {/* Left: Album art + controls */}
      <div className="lg:w-96 flex flex-col items-center gap-6">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-[#f2e8c7] transition-colors">
            <ChevronDown size={20} style={{ color: '#665f41' }} />
          </button>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#bbb28f' }}>
              Đang Phát
            </p>
          </div>
          <button onClick={toggleMiniPlayer}
            className="p-2 rounded-xl hover:bg-[#f2e8c7] transition-colors">
            <Minimize2 size={20} style={{ color: '#665f41' }} />
          </button>
        </div>

        {/* Album Art */}
        <motion.div
          key={currentSong.id}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="w-72 h-72 lg:w-80 lg:h-80 rounded-3xl overflow-hidden shadow-float">
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="w-full h-full object-cover"
              style={{
                animation: isPlaying ? 'none' : undefined,
                filter: isPlaying ? 'brightness(1)' : 'brightness(0.85)',
                transition: 'filter 0.3s ease',
              }}
            />
          </div>
          {/* Playing indicator */}
          {isPlaying && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1 px-3 py-1.5 rounded-full shadow-card"
              style={{ background: '#fff9ec' }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="w-1 rounded-full animate-pulse-glow"
                  style={{
                    height: `${10 + (i % 2) * 6}px`,
                    background: '#2c2c2c',
                    animationDelay: `${i * 0.1}s`
                  }} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Song info */}
        <div className="text-center w-full">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)}
              className="p-2 opacity-0 pointer-events-none"><div /></button>
            <div>
              <h2 className="text-xl font-bold line-clamp-1" style={{ color: '#383318' }}>
                {currentSong.title}
              </h2>
              <p className="text-sm mt-1" style={{ color: '#665f41' }}>{currentSong.artist}</p>
              <p className="text-xs mt-0.5" style={{ color: '#bbb28f' }}>{currentSong.album}</p>
            </div>
            <button onClick={toggleLike} className="p-2">
              <Heart
                size={20}
                style={{ color: isLiked ? '#9f403d' : '#bbb28f' }}
                fill={isLiked ? '#9f403d' : 'none'}
              />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full space-y-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={e => seekTo(Number(e.target.value))}
            className="progress-bar w-full"
            style={{
              background: `linear-gradient(to right, #2c2c2c ${progress}%, rgba(187,178,143,0.3) ${progress}%)`,
            }}
          />
          <div className="flex justify-between text-xs" style={{ color: '#bbb28f' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button onClick={toggleShuffle}
            className={`p-2 transition-all ${isShuffle ? 'opacity-100' : 'opacity-30'}`}>
            <Shuffle size={18} style={{ color: '#2c2c2c' }} />
          </button>
          <button onClick={playPrev}
            className="p-3 hover:bg-[#f2e8c7] rounded-full transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#383318">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-float"
            style={{ background: '#2c2c2c' }}
          >
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff9ec">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff9ec">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          <button onClick={playNext}
            className="p-3 hover:bg-[#f2e8c7] rounded-full transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#383318">
              <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z"/>
            </svg>
          </button>
          <button className="p-2 opacity-30">
            <MoreHorizontal size={18} style={{ color: '#2c2c2c' }} />
          </button>
        </div>
      </div>

      {/* Right: Lyrics / Queue */}
      <div className="flex-1 min-h-0">
        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6" style={{ borderColor: '#ede3bd' }}>
          {(['lyrics', 'queue'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-3 text-sm font-medium transition-all relative"
              style={{ color: tab === t ? '#383318' : '#bbb28f' }}
            >
              {t === 'lyrics' ? '🎤 Lời Bài Hát' : '🎵 Hàng Đợi'}
              {tab === t && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#2c2c2c' }}
                />
              )}
            </button>
          ))}
        </div>

        {tab === 'lyrics' ? (
          <div ref={lyricsRef} className="space-y-4 overflow-y-auto max-h-96">
            {currentSong.lyrics.map((line, i) => (
              <p
                key={i}
                className={`lyric-line text-lg font-medium leading-relaxed ${i === activeLyricIdx ? 'active' : ''}`}
                style={{ color: '#383318' }}
              >
                {line.text}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto max-h-96">
            {queue.map((song, i) => (
              <div
                key={song.id}
                onClick={() => playSong(song, queue)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: currentSong.id === song.id ? '#f2e8c7' : 'transparent',
                }}
              >
                <span className="text-xs w-5 text-center" style={{ color: '#bbb28f' }}>{i + 1}</span>
                <img src={song.cover} alt={song.title}
                  className="w-9 h-9 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1" style={{ color: '#383318' }}>
                    {song.title}
                  </p>
                  <p className="text-xs" style={{ color: '#665f41' }}>{song.artist}</p>
                </div>
                <span className="text-xs" style={{ color: '#bbb28f' }}>{formatTime(song.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
