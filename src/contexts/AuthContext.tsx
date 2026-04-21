import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { username: string; email: string; password: string; displayName: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const stored = localStorage.getItem('muzika_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('muzika_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.get<User[]>(`/users?email=${email}`);
      const found = res.data[0];
      if (!found) {
        toast.error('Email không tồn tại');
        return false;
      }
      // Simple password check (in production use bcrypt)
      // For demo: check plain text or the demo password "password"
      const validPassword = password === 'password' || found.password === password;
      if (!validPassword) {
        toast.error('Sai mật khẩu');
        return false;
      }
      const { password: _, ...safeUser } = found;
      setUser(safeUser as User);
      localStorage.setItem('muzika_user', JSON.stringify(safeUser));
      toast.success(`Chào mừng, ${found.displayName}! 🎵`);
      return true;
    } catch {
      toast.error('Đã xảy ra lỗi, vui lòng thử lại');
      return false;
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }): Promise<boolean> => {
    try {
      // Check if email exists
      const check = await api.get(`/users?email=${data.email}`);
      if (check.data.length > 0) {
        toast.error('Email đã được sử dụng');
        return false;
      }

      const newUser: User = {
        id: `u${Date.now()}`,
        username: data.username,
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        bio: '',
        following: [],
        followers: [],
        createdAt: new Date().toISOString(),
      };

      const res = await api.post<User>('/users', newUser);
      const { password: _, ...safeUser } = res.data;
      setUser(safeUser as User);
      localStorage.setItem('muzika_user', JSON.stringify(safeUser));
      toast.success('Đăng ký thành công! Chào mừng đến với Muzika 🎵');
      return true;
    } catch {
      toast.error('Đăng ký thất bại, vui lòng thử lại');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('muzika_user');
    toast.success('Đã đăng xuất');
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const res = await api.patch<User>(`/users/${user.id}`, data);
      const updated = { ...user, ...res.data };
      setUser(updated);
      localStorage.setItem('muzika_user', JSON.stringify(updated));
      toast.success('Cập nhật thành công');
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
