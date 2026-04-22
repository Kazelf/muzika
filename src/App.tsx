import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import Layout from './components/layout/Layout';
import Discover from './pages/Discover';
import Search from './pages/Search';
import Library from './pages/Library';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import NowPlaying from './pages/NowPlaying';
import Stats from './pages/Stats';
import Social from './pages/Social';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#fff9ec' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-outline-variant border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: '#665f41' }}>Muzika đang tải...</p>
        </div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Discover />} />
        <Route path="search" element={<Search />} />
        <Route path="library" element={<Library />} />
        <Route path="playlists" element={<Playlists />} />
        <Route path="playlists/:id" element={<PlaylistDetail />} />
        <Route path="now-playing" element={<NowPlaying />} />
        <Route path="stats" element={<Stats />} />
        <Route path="social" element={<Social />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#fff9ec',
                color: '#383318',
                borderRadius: '12px',
                border: '1px solid rgba(187, 178, 143, 0.2)',
                boxShadow: '0 8px 32px rgba(56, 51, 24, 0.10)',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#486272', secondary: '#fff9ec' },
              },
              error: {
                iconTheme: { primary: '#9f403d', secondary: '#fff9ec' },
              },
            }}
          />
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
