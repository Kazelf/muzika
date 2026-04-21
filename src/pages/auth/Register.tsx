import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const ok = await register(form);
    setIsLoading(false);
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#fff9ec' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#2c2c2c' }}>
            <Music2 size={18} color="#fff9ec" />
          </div>
          <span className="text-xl font-bold" style={{ color: '#2c2c2c' }}>Muzika</span>
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: '#383318' }}>Tạo Tài Khoản</h2>
        <p className="text-sm mb-8" style={{ color: '#665f41' }}>
          Tham gia cộng đồng yêu nhạc của Muzika
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'displayName', label: 'Tên hiển thị', type: 'text', placeholder: 'Tên của bạn' },
            { key: 'username', label: 'Tên người dùng', type: 'text', placeholder: 'username' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
            { key: 'password', label: 'Mật khẩu', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                {label}
              </label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none border-ghost"
                style={{ background: '#f2e8c7', color: '#383318' }}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: '#2c2c2c', color: '#fff9ec' }}
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#665f41' }}>
          Đã có tài khoản?{' '}
          <button onClick={() => navigate('/login')}
            className="font-semibold" style={{ color: '#2c2c2c' }}>
            Đăng nhập
          </button>
        </p>
      </motion.div>
    </div>
  );
}
