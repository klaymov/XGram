import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import telegramService from '../services/telegram';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    needsCredentials: false,
  });

  // Try to restore session on mount
  useEffect(() => {
    (async () => {
      const credentials = telegramService.getStoredCredentials();
      if (!credentials) {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          needsCredentials: true,
        });
        return;
      }

      const restored = await telegramService.tryRestoreSession();
      if (restored) {
        const me = await telegramService.getMe();
        setState({
          isLoading: false,
          isAuthenticated: true,
          user: me,
          needsCredentials: false,
        });
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          needsCredentials: false,
        });
      }
    })();
  }, []);

  const setAuthenticated = useCallback((user) => {
    setState({
      isLoading: false,
      isAuthenticated: true,
      user,
      needsCredentials: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await telegramService.logout();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      needsCredentials: false,
    });
  }, []);

  const setNeedsCredentials = useCallback((value) => {
    setState((prev) => ({ ...prev, needsCredentials: value }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setAuthenticated,
        logout,
        setNeedsCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
