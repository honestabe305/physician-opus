import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import LockScreen from '@/components/LockScreen';
import { useSecurityPreferences } from '@/hooks/use-security-preferences';

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
  sessionTimeRemaining: number | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (profile: Profile) => void;
  extendSession: () => Promise<void>;
  lockSession: () => void;
  unlockSession: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get security preferences
  const {
    preferences: securityPreferences,
    addActivityLogEntry,
    updateLastActivity,
    sessionWarningActive,
    timeUntilTimeout,
    isLocked,
    unlockSession: unlockFromSecurity,
    getDeviceInfo,
    getIpAddress
  } = useSecurityPreferences();

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
        
        // Log successful login
        addActivityLogEntry({
          type: 'login',
          ipAddress: getIpAddress(),
          device: getDeviceInfo(),
          success: true,
          details: rememberMe ? 'Login with remember me enabled' : 'Standard login'
        });
        
        // Update last activity
        updateLastActivity();
        
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
      // Log failed login attempt
      addActivityLogEntry({
        type: 'access_attempt',
        ipAddress: getIpAddress(),
        device: getDeviceInfo(),
        success: false,
        details: error instanceof Error ? error.message : 'Login failed'
      });
      
      // Error handling is done in the LoginPage component
      throw error;
    }
  }, [setLocation, toast, addActivityLogEntry, updateLastActivity, getDeviceInfo, getIpAddress]);

  // Signup function
  const signup = useCallback(async (email: string, username: string, password: string, fullName?: string) => {
    try {
      const response = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, username, password, fullName }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response && response.user) {
        setUser(response.user);
        setProfile(response.profile || null);
        setSessionExpiresAt(response.sessionExpiresAt ? new Date(response.sessionExpiresAt) : null);
        
        // Log successful signup
        addActivityLogEntry({
          type: 'login',
          ipAddress: getIpAddress(),
          device: getDeviceInfo(),
          success: true,
          details: 'Account created and logged in'
        });
        
        // Update last activity
        updateLastActivity();
        
        // Invalidate any cached queries
        await queryClient.invalidateQueries();
        
        // Redirect to dashboard
        setLocation('/');
        
        toast({
          title: "Account created successfully",
          description: "Welcome to PhysicianCRM! Your account has been created and you're now logged in.",
        });
      }
    } catch (error) {
      // Log failed signup attempt
      addActivityLogEntry({
        type: 'access_attempt',
        ipAddress: getIpAddress(),
        device: getDeviceInfo(),
        success: false,
        details: error instanceof Error ? `Signup failed: ${error.message}` : 'Signup failed'
      });
      
      // Error handling is done in the SignUpPage component
      throw error;
    }
  }, [setLocation, toast, addActivityLogEntry, updateLastActivity, getDeviceInfo, getIpAddress]);

  // Logout function
  const logout = useCallback(async () => {
    // Log logout event
    addActivityLogEntry({
      type: 'logout',
      ipAddress: getIpAddress(),
      device: getDeviceInfo(),
      success: true,
      details: 'Manual logout'
    });
    
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
      setSessionTimeRemaining(null);
      
      // Clear session timer
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to login
      setLocation('/login');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    }
  }, [setLocation, toast, addActivityLogEntry, getDeviceInfo, getIpAddress]);

  // Update profile function
  const updateProfile = useCallback((newProfile: Profile) => {
    setProfile(newProfile);
  }, []);
  
  // Extend session function
  const extendSession = useCallback(async () => {
    try {
      const response = await apiRequest('/auth/extend-session', {
        method: 'POST',
      });
      
      if (response && response.sessionExpiresAt) {
        setSessionExpiresAt(new Date(response.sessionExpiresAt));
        updateLastActivity();
        
        toast({
          title: "Session extended",
          description: "Your session has been extended",
        });
        
        // Log session extension
        addActivityLogEntry({
          type: 'settings_change',
          ipAddress: getIpAddress(),
          device: getDeviceInfo(),
          success: true,
          details: 'Session extended'
        });
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast({
        title: "Failed to extend session",
        description: "Please log in again",
        variant: "destructive",
      });
    }
  }, [toast, updateLastActivity, addActivityLogEntry, getDeviceInfo, getIpAddress]);
  
  // Lock session function
  const lockSession = useCallback(() => {
    // This is handled by the security preferences hook
    // But we can trigger it manually if needed
    addActivityLogEntry({
      type: 'access_attempt',
      ipAddress: getIpAddress(),
      device: getDeviceInfo(),
      success: true,
      details: 'Session manually locked'
    });
  }, [addActivityLogEntry, getDeviceInfo, getIpAddress]);
  
  // Unlock session function
  const unlockSession = useCallback(() => {
    unlockFromSecurity();
    updateLastActivity();
  }, [unlockFromSecurity, updateLastActivity]);

  // Check auth on mount and set up axios interceptor
  // 🚧 TEMPORARY UAT BYPASS - Check for bypass mode
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';
  
  // Mock user for bypass mode
  const mockUser: User = {
    id: 'bypass-user-id',
    email: 'uat@physiciancrm.com',
    username: 'uat-tester',
    role: 'admin',
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastPasswordChangeAt: null
  };
  
  const mockProfile: Profile = {
    id: 'bypass-profile-id',
    userId: 'bypass-user-id',
    email: 'uat@physiciancrm.com',
    fullName: 'UAT Test Administrator',
    role: 'admin',
    organization: 'PhysicianCRM Testing',
    department: 'UAT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  useEffect(() => {
    if (bypassAuth) {
      console.log('🚧 AUTH BYPASS ENABLED - UAT Testing Mode');
      setUser(mockUser);
      setProfile(mockProfile);
      setSessionExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours
      setIsLoading(false);
      return;
    }
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

    // Note: Keep unauthorized listener even in bypass mode to catch API mismatches
    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [checkAuth, setLocation, toast, bypassAuth]);

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

  // Track session time remaining
  useEffect(() => {
    if (sessionExpiresAt && user) {
      const updateTimeRemaining = () => {
        const now = new Date().getTime();
        const expiry = sessionExpiresAt.getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setSessionTimeRemaining(remaining);
        
        if (remaining === 0 && !sessionWarningActive) {
          // Session expired
          logout();
        }
      };
      
      updateTimeRemaining();
      sessionTimerRef.current = setInterval(updateTimeRemaining, 1000);
      
      return () => {
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
        }
      };
    } else {
      setSessionTimeRemaining(null);
    }
  }, [sessionExpiresAt, user, logout, sessionWarningActive]);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    sessionExpiresAt,
    sessionTimeRemaining,
    login,
    signup,
    logout,
    checkAuth,
    updateProfile,
    extendSession,
    lockSession,
    unlockSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Render lock screen when session is locked */}
      <LockScreen
        isLocked={isLocked}
        onUnlock={unlockSession}
        timeUntilTimeout={timeUntilTimeout}
        sessionWarningActive={sessionWarningActive}
      />
    </AuthContext.Provider>
  );
}