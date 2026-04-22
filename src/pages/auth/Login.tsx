import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music2, Eye, EyeOff, X, Copy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@muzika.vn');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: email, 2: otp, 3: new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotUserId, setForgotUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const ok = await login(email, password);
    setIsLoading(false);
    if (ok) navigate('/');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotStep === 1) {
      setIsLoading(true);
      try {
        const res = await api.get(`/users?email=${forgotEmail}`);
        if (res.data.length === 0) {
          toast.error('Email không tồn tại trong hệ thống');
        } else {
          setForgotUserId(res.data[0].id);
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedOtp(otp);
          setForgotStep(2);
        }
      } catch {
        toast.error('Lỗi kết nối');
      } finally {
        setIsLoading(false);
      }
    } else if (forgotStep === 2) {
      if (enteredOtp !== generatedOtp) {
        toast.error('Mã OTP không chính xác');
        return;
      }
      setForgotStep(3);
    } else if (forgotStep === 3) {
      setIsLoading(true);
      try {
        await api.patch(`/users/${forgotUserId}`, { password: newPassword });
        toast.success('Đặt lại mật khẩu thành công!');
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setEnteredOtp('');
        setNewPassword('');
      } catch {
        toast.error('Có lỗi xảy ra');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(generatedOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Đã copy OTP');
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium" style={{ color: '#383318' }}>
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#486272' }}
                >
                  Quên mật khẩu?
                </button>
              </div>
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl p-6 shadow-xl relative"
            style={{ background: '#fff9ec' }}
          >
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep(1);
                setEnteredOtp('');
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <X size={20} style={{ color: '#665f41' }} />
            </button>

            <h3 className="text-xl font-bold mb-4" style={{ color: '#383318' }}>
              {forgotStep === 1 ? 'Quên mật khẩu' : forgotStep === 2 ? 'Xác thực OTP' : 'Đặt mật khẩu mới'}
            </h3>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {forgotStep === 1 && (
                <div>
                  <p className="text-sm mb-4" style={{ color: '#665f41' }}>
                    Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu.
                  </p>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#f2e8c7', color: '#383318' }}
                    required
                  />
                </div>
              )}

              {forgotStep === 2 && (
                <div className="text-center">
                  <p className="text-sm mb-4" style={{ color: '#665f41' }}>
                    Mã OTP (Mock) đã được tạo. Vui lòng copy mã bên dưới và điền vào ô xác nhận.
                  </p>
                  
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl mb-6" style={{ background: '#f2e8c7' }}>
                    <span className="text-2xl font-bold tracking-[0.25em] text-error">{generatedOtp}</span>
                    <button
                      type="button"
                      onClick={copyOtp}
                      className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                      title="Copy OTP"
                    >
                      {copied ? <Check size={18} color="#486272" /> : <Copy size={18} color="#665f41" />}
                    </button>
                  </div>

                  <div className="text-left">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                      Nhập mã OTP
                    </label>
                    <input
                      type="text"
                      value={enteredOtp}
                      onChange={e => setEnteredOtp(e.target.value)}
                      placeholder="Nhập 6 số..."
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-center tracking-widest font-bold"
                      style={{ background: '#f2e8c7', color: '#383318' }}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              {forgotStep === 3 && (
                <div>
                  <p className="text-sm mb-4" style={{ color: '#665f41' }}>
                    Mã xác thực chính xác. Vui lòng nhập mật khẩu mới.
                  </p>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#383318' }}>
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#f2e8c7', color: '#383318' }}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: '#2c2c2c', color: '#fff9ec', marginTop: '24px' }}
              >
                {isLoading ? 'Đang xử lý...' : forgotStep === 1 ? 'Gửi OTP' : forgotStep === 2 ? 'Xác Nhận' : 'Cập Nhật Mật Khẩu'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
