import { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem('lobna-admin-token') || ''; } catch { return ''; } });
  const login = async credentials => {
    const result = await apiRequest('/api/auth/login', { method: 'POST', body: credentials });
    setToken(result.token);
    try { sessionStorage.setItem('lobna-admin-token', result.token); } catch { /* sessionStorage can be disabled */ }
    return result;
  };
  const logout = () => {
    setToken('');
    try { sessionStorage.removeItem('lobna-admin-token'); } catch { /* ignore */ }
  };
  const value = useMemo(() => ({ token, isAuthenticated: Boolean(token), login, logout }), [token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
