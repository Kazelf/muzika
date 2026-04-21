import { NavLink, useNavigate } from 'react-router-dom';
import {
  Compass, Search, Library, BarChart2, ListMusic,
  Music2, User, LogOut, Plus, Heart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: Compass, label: 'Khám Phá', end: true },
  { to: '/search', icon: Search, label: 'Tìm Kiếm' },
  { to: '/library', icon: Library, label: 'Thư Viện' },
  { to: '/playlists', icon: ListMusic, label: 'Playlist' },
  { to: '/stats', icon: BarChart2, label: 'Thống Kê' },
  { to: '/social', icon: User, label: 'Cộng Đồng' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { currentSong } = usePlayer();
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 lg:w-64 flex flex-col z-30"
      style={{ background: '#f6eed2' }}>

      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: '#2c2c2c' }}>
          <Music2 size={16} color="#fff9ec" />
        </div>
        <span className="font-bold text-xl tracking-tight" style={{ color: '#2c2c2c' }}>
          Muzika
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-item flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                isActive
                  ? 'active'
                  : 'text-[#665f41] hover:text-[#383318]'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Divider */}
        <div className="my-4 h-px" style={{ background: '#ede3bd' }} />

        {/* Liked Songs */}
        <NavLink
          to="/library?tab=liked"
          className={({ isActive }) =>
            `nav-item flex items-center gap-3 px-4 py-2.5 text-sm ${
              isActive ? 'active' : 'text-[#665f41] hover:text-[#383318]'
            }`
          }
        >
          <Heart size={18} className="text-rose-400" />
          <span>Bài Yêu Thích</span>
        </NavLink>

        {/* Create Playlist */}
        <button
          onClick={() => navigate('/playlists?new=true')}
          className="nav-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#665f41] hover:text-[#383318]"
        >
          <Plus size={18} />
          <span>Tạo Playlist</span>
        </button>
      </nav>

      {/* Now playing mini indicator */}
      {currentSong && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mb-3 p-3 rounded-xl cursor-pointer card-hover"
          style={{ background: '#ede3bd' }}
          onClick={() => navigate('/now-playing')}
        >
          <div className="flex items-center gap-2">
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold line-clamp-1" style={{ color: '#383318' }}>
                {currentSong.title}
              </p>
              <p className="text-xs line-clamp-1" style={{ color: '#665f41' }}>
                {currentSong.artist}
              </p>
            </div>
            <div className="flex gap-0.5">
              {[1,2,3].map(i => (
                <div key={i} className="w-0.5 rounded-full animate-pulse-glow"
                  style={{
                    height: `${8 + i * 4}px`,
                    background: '#2c2c2c',
                    animationDelay: `${i * 0.15}s`
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* User profile */}
      {user && (
        <div className="px-4 py-4 border-t" style={{ borderColor: '#ede3bd' }}>
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-9 h-9 rounded-full bg-[#e4e2e1]"
              onClick={() => navigate('/profile')}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-1" style={{ color: '#383318' }}>
                {user.displayName}
              </p>
              <p className="text-xs line-clamp-1" style={{ color: '#665f41' }}>
                @{user.username}
              </p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-[#ede3bd] transition-colors">
              <LogOut size={15} style={{ color: '#827b5b' }} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
