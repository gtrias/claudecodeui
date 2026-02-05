import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../utils/api';
import { IS_PLATFORM } from '../constants/config';

// Type definitions
export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  needsSetup: boolean;
  hasCompletedOnboarding: boolean;
  refreshOnboardingStatus: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => Promise.resolve(),
  register: () => Promise.resolve(),
  logout: () => {},
  isLoading: true,
  needsSetup: false,
  hasCompletedOnboarding: true,
  refreshOnboardingStatus: () => Promise.resolve(),
  error: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth-token'));
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (IS_PLATFORM) {
      setUser({ id: 0, username: 'platform-user', created_at: new Date().toISOString() });
      setNeedsSetup(false);
      checkOnboardingStatus();
      setIsLoading(false);
      return;
    }

    checkAuthStatus();
  }, []);

  const checkOnboardingStatus = async (): Promise<void> => {
    try {
      const response = await api.user.onboardingStatus();
      if (response.ok) {
        const data = await response.json();
        setHasCompletedOnboarding(data.hasCompletedOnboarding);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error instanceof Error ? error.message : 'Unknown error');
      setHasCompletedOnboarding(true);
    }
  };

  const refreshOnboardingStatus = async (): Promise<void> => {
    await checkOnboardingStatus();
  };

  const checkAuthStatus = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if system needs setup
      const statusResponse = await api.auth.status();
      const statusData = await statusResponse.json();

      if (statusData.needsSetup) {
        setNeedsSetup(true);
        setIsLoading(false);
        return;
      }

      // If we have a token, verify it
      if (token) {
        try {
          const userResponse = await api.auth.user();

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData.user);
            setNeedsSetup(false);
            await checkOnboardingStatus();
          } else {
            // Token is invalid
            localStorage.removeItem('auth-token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
          localStorage.removeItem('auth-token');
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error instanceof Error ? error.message : 'Unknown error');
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.auth.login(username, password);
      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        localStorage.setItem('auth-token', data.token);
        setUser(data.user);
        setNeedsSetup(false);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.auth.register(username, password);
      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        localStorage.setItem('auth-token', data.token);
        setUser(data.user);
        setNeedsSetup(false);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setToken(null);
    localStorage.removeItem('auth-token');
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    needsSetup,
    hasCompletedOnboarding,
    refreshOnboardingStatus,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;