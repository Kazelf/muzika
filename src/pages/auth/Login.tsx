import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@muzika.vn');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const ok = await login(email, password);
    setIsLoading(false);
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#fff9ec' }}>
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: '#f6eed2' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#2c2c2c' }}>
            <Music2 size={20} color="#fff9ec" />
          </div>
          <span className="text-2xl font-bold" style={{ color: '#2c2c2c' }}>Muzika</span>
        </div>
        <div>
          <p className="text-5xl font-bold leading-tight mb-4" style={{ color: '#383318' }}>
            Âm nhạc dành<br />riêng cho bạn
          </p>
          <p className="text-lg" style={{ color: '#665f41' }}>
            Khám phá, thưởng thức và chia sẻ những giai điệu<br />đồng hành cùng mọi khoảnh khắc.
          </p>
        </div>
        <div className="flex gap-3">
          {['🎵', '🎸', '🎹', '🥁'].map((e, i) => (
            <span key={i} className="text-3xl opacity-60">{e}</span>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#2c2c2c' }}>
              <Music2 size={18} color="#fff9ec" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#2c2c2c' }}>Muzika</span>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: '#383318' }}>Đăng Nhập</h2>
          <p className="text-sm mb-8" style={{ color: '#665f41' }}>
            Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none border-ghost transition-all"
                style={{ background: '#f2e8c7', color: '#383318' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-sm outline-none border-ghost pr-12"
                  style={{ background: '#f2e8c7', color: '#383318' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                >
                  {showPassword
                    ? <EyeOff size={16} style={{ color: '#827b5b' }} />
                    : <Eye size={16} style={{ color: '#827b5b' }} />
                  }
                </button>
              </div>
            </div>

            {/* Demo hint */}
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#d0ecff', color: '#486272' }}>
              💡 Demo: <strong>demo@muzika.vn</strong> / <strong>password</strong>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: '#2c2c2c', color: '#fff9ec' }}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#665f41' }}>
            Chưa có tài khoản?{' '}
            <button onClick={() => navigate('/register')}
              className="font-semibold" style={{ color: '#2c2c2c' }}>
              Đăng ký ngay
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
