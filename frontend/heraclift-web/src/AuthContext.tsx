import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, getToken, setToken, clearToken } from './api';

interface AuthUser {
  username: string;
}

interface AuthResponse {
  token: string;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getToken();
    const username = sessionStorage.getItem('heraclift_user');
    return token && username ? { username } : null;
  });

  const login = async (username: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { username, password });
    setToken(res.token);
    sessionStorage.setItem('heraclift_user', res.username);
    setUser({ username: res.username });
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/register', { username, email, password });
    setToken(res.token);
    sessionStorage.setItem('heraclift_user', res.username);
    setUser({ username: res.username });
  };

  const logout = () => {
    clearToken();
    sessionStorage.removeItem('heraclift_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook, not a component
export const useAuth = () => useContext(AuthContext) as AuthContextValue;
