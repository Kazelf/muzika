import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import PlayerBar from '../player/PlayerBar';
import MiniPlayer from '../player/MiniPlayer';
import { usePlayer } from '../../contexts/PlayerContext';

export default function Layout() {
  const { currentSong } = usePlayer();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#fff9ec' }}>
      {/* Sidebar */}
      <div className="hidden md:block w-56 lg:w-64 flex-shrink-0" />
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto pt-16"
          style={{ paddingBottom: currentSong ? '6rem' : '1.5rem' }}
        >
          <div className="px-4 md:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Player Bar */}
      {currentSong && <PlayerBar />}

      {/* Mini Player */}
      <MiniPlayer />
    </div>
  );
}
