import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return <div className="text-center py-32"><p>Vui lòng đăng nhập</p></div>;

  const handleSave = async () => {
    setIsSaving(true);
    await updateUser({ displayName, bio });
    setIsSaving(false);
  };

  return (
    <div className=" space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#383318' }}>Hồ Sơ</h1>
        <p className="text-sm mt-1" style={{ color: '#665f41' }}>Quản lý thông tin cá nhân</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <img src={user.avatar} alt={user.displayName}
            className="w-24 h-24 rounded-full object-cover"
            style={{ background: '#e4e2e1' }} />
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#2c2c2c' }}>
            <Camera size={14} color="#fff9ec" />
          </button>
        </div>
        <div>
          <p className="text-xl font-bold" style={{ color: '#383318' }}>{user.displayName}</p>
          <p className="text-sm" style={{ color: '#665f41' }}>@{user.username}</p>
          <p className="text-xs mt-1" style={{ color: '#bbb28f' }}>{user.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 p-6 rounded-2xl" style={{ background: '#fbf3dd' }}>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
            Tên hiển thị
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none border-ghost"
            style={{ background: '#f2e8c7', color: '#383318' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
            Giới thiệu
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none border-ghost"
            style={{ background: '#f2e8c7', color: '#383318' }}
            placeholder="Viết gì đó về bản thân..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: '#2c2c2c', color: '#fff9ec' }}
          >
            <Save size={16} />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button
            onClick={logout}
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#f2e8c7', color: '#9f403d' }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Người theo dõi', value: user.followers?.length || 0 },
          { label: 'Đang theo dõi', value: user.following?.length || 0 },
          { label: 'Ngày tham gia', value: new Date(user.createdAt).toLocaleDateString('vi-VN') },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-2xl text-center" style={{ background: '#fbf3dd' }}>
            <p className="text-xl font-bold" style={{ color: '#383318' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: '#827b5b' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
