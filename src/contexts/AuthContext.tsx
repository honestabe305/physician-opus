import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastPasswordChangeAt?: string;
}

interface Profile {
  id: string;
  userId: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  role?: string;
  organization?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpiresAt: Date | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/auth/me');
      
      if (response && response.user) {
        setUser(response.user);
        setProfile(response.profile || null);
        setSessionExpiresAt(response.sessionExpiresAt ? new Date(response.sessionExpiresAt) : null);
        
        // Set up session refresh timer
        if (response.sessionExpiresAt) {
          const expiryTime = new Date(response.sessionExpiresAt).getTime();
          const currentTime = new Date().getTime();
          const timeUntilExpiry = expiryTime - currentTime;
          
          // Refresh session 5 minutes before expiry
          const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
          
          if (refreshTime > 0) {
            setTimeout(() => {
              checkAuth();
            }, refreshTime);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setSessionExpiresAt(null);
      }
    } catch (error) {
      // Session is invalid or expired
      setUser(null);
      setProfile(null);
      setSessionExpiresAt(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (username: string, password: string, rememberMe = false) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, rememberMe }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response && response.user) {
        setUser(response.user);
        setProfile(response.profile || null);
        setSessionExpiresAt(response.sessionExpiresAt ? new Date(response.sessionExpiresAt) : null);
        
        // Invalidate any cached queries
        await queryClient.invalidateQueries();
        
        // Redirect to dashboard or originally requested page
        const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
        setLocation(redirectTo);
        
        toast({
          title: "Login successful",
          description: "Welcome back to PhysicianCRM",
        });
      }
    } catch (error) {
      // Error handling is done in the LoginPage component
      throw error;
    }
  }, [setLocation, toast]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    } finally {
      // Clear user state
      setUser(null);
      setProfile(null);
      setSessionExpiresAt(null);
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to login
      setLocation('/login');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    }
  }, [setLocation, toast]);

  // Update profile function
  const updateProfile = useCallback((newProfile: Profile) => {
    setProfile(newProfile);
  }, []);

  // Check auth on mount and set up axios interceptor
  useEffect(() => {
    checkAuth();

    // Set up global error handler for 401 responses
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.status === 401) {
        setUser(null);
        setProfile(null);
        setSessionExpiresAt(null);
        setLocation('/login');
        
        toast({
          title: "Session expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [checkAuth, setLocation, toast]);

  // Add global fetch interceptor to handle 401 responses
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        // Dispatch custom event for unauthorized access
        window.dispatchEvent(new CustomEvent('unauthorized', { detail: { status: 401 } }));
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    sessionExpiresAt,
    login,
    logout,
    checkAuth,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}