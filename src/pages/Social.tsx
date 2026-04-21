import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserCheck, Music, Play } from 'lucide-react';
import { User, Song, Playlist } from '../types';
import { usersService, playlistsService, songsService } from '../services/music.service';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import toast from 'react-hot-toast';

interface UserWithData extends User {
  playlists: Playlist[];
  topSong: Song | null;
}

export default function Social() {
  const { user, updateUser } = useAuth();
  const { playSong } = usePlayer();
  const [users, setUsers] = useState<UserWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, playlistsRes, songsRes] = await Promise.all([
          usersService.getAll(),
          playlistsService.getPublic(),
          songsService.getAll(),
        ]);
        const allUsers: User[] = usersRes.data.filter((u: User) => u.id !== user?.id);
        const allPlaylists: Playlist[] = playlistsRes.data;
        const allSongs: Song[] = songsRes.data;

        const enriched: UserWithData[] = allUsers.map(u => ({
          ...u,
          playlists: allPlaylists.filter(p => p.userId === u.id && p.isPublic),
          topSong: allSongs.sort((a, b) => b.playCount - a.playCount)[0],
        }));
        setUsers(enriched);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const isFollowing = (targetId: string) => user?.following?.includes(targetId) ?? false;

  const toggleFollow = async (target: User) => {
    if (!user) return;
    const following = isFollowing(target.id);
    const myFollowing = user.following || [];
    const targetFollowers = target.followers || [];

    if (following) {
      await usersService.unfollow(user.id, target.id, myFollowing, targetFollowers);
      await updateUser({ following: myFollowing.filter(id => id !== target.id) });
      toast.success(`Đã bỏ theo dõi ${target.displayName}`);
    } else {
      await usersService.follow(user.id, target.id, myFollowing, targetFollowers);
      await updateUser({ following: [...myFollowing, target.id] });
      toast.success(`Đang theo dõi ${target.displayName}`);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#383318' }}>Cộng Đồng</h1>
        <p className="text-sm mt-1" style={{ color: '#665f41' }}>
          Kết nối và khám phá nhạc cùng mọi người
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Đang theo dõi', value: user?.following?.length || 0, icon: UserCheck },
          { label: 'Người theo dõi', value: user?.followers?.length || 0, icon: Users },
          { label: 'Tổng người dùng', value: users.length + 1, icon: UserPlus },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-5 rounded-2xl text-center" style={{ background: '#fbf3dd' }}>
            <Icon size={20} style={{ color: '#486272' }} className="mx-auto mb-2" />
            <p className="text-2xl font-bold" style={{ color: '#383318' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: '#827b5b' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Users list */}
      <section>
        <h2 className="font-bold mb-4" style={{ color: '#383318' }}>👥 Người Dùng Khác</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#bbb28f] border-t-[#2c2c2c] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: '#fbf3dd' }}
              >
                <img src={u.avatar} alt={u.displayName}
                  className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold" style={{ color: '#383318' }}>{u.displayName}</p>
                  <p className="text-sm" style={{ color: '#665f41' }}>@{u.username}</p>
                  {u.bio && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#bbb28f' }}>
                      {u.bio}
                    </p>
                  )}
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs" style={{ color: '#bbb28f' }}>
                      {u.playlists.length} playlist
                    </span>
                    <span className="text-xs" style={{ color: '#bbb28f' }}>
                      {u.followers.length} người theo dõi
                    </span>
                  </div>
                </div>

                {/* Public playlists preview */}
                {u.playlists.length > 0 && (
                  <div className="hidden md:flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                      style={{ background: '#f2e8c7', color: '#665f41' }}>
                      <Music size={12} />
                      {u.playlists[0].title}
                    </div>
                  </div>
                )}

                {user && (
                  <button
                    onClick={() => toggleFollow(u)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isFollowing(u.id) ? '#f2e8c7' : '#2c2c2c',
                      color: isFollowing(u.id) ? '#665f41' : '#fff9ec',
                    }}
                  >
                    {isFollowing(u.id) ? (
                      <><UserCheck size={14} /> Đang theo dõi</>
                    ) : (
                      <><UserPlus size={14} /> Theo dõi</>
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
