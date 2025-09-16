import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'login' | 'logout' | 'password_change' | 'settings_change' | 'access_attempt';
  ipAddress: string;
  device: string;
  location?: string;
  success: boolean;
  details?: string;
}

export interface SecurityPreferences {
  // Session Management
  sessionTimeout: number; // in minutes
  rememberMe: boolean;
  autoLock: boolean;
  showWarningBeforeTimeout: boolean;
  warningTime: number; // minutes before timeout
  
  // Activity Monitoring
  enableActivityLogging: boolean;
  activityLog: ActivityLogEntry[];
  lastActivityTime: number;
  
  // Two-Factor Authentication
  twoFactorEnabled: boolean;
  backupCodesGenerated: boolean;
  
  // Security Preferences
  requirePasswordForSensitiveActions: boolean;
  showSecurityAlerts: boolean;
  passwordComplexityLevel: 'basic' | 'moderate' | 'strong';
  
  // Additional Security Settings
  allowMultipleSessions: boolean;
  sessionLockAfterFailedAttempts: number;
  ipWhitelist: string[];
  trustedDevices: string[];
}

const STORAGE_KEY = 'physician-crm-security-preferences';
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
const DEFAULT_WARNING_TIME = 5; // minutes

const defaultPreferences: SecurityPreferences = {
  // Session Management
  sessionTimeout: 30,
  rememberMe: false,
  autoLock: false,
  showWarningBeforeTimeout: true,
  warningTime: DEFAULT_WARNING_TIME,
  
  // Activity Monitoring
  enableActivityLogging: true,
  activityLog: [],
  lastActivityTime: Date.now(),
  
  // Two-Factor Authentication
  twoFactorEnabled: false,
  backupCodesGenerated: false,
  
  // Security Preferences
  requirePasswordForSensitiveActions: false,
  showSecurityAlerts: true,
  passwordComplexityLevel: 'moderate',
  
  // Additional Security Settings
  allowMultipleSessions: true,
  sessionLockAfterFailedAttempts: 5,
  ipWhitelist: [],
  trustedDevices: []
};

// Get device and location info
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let device = 'Unknown Device';
  
  if (userAgent.includes('Chrome')) device = 'Chrome';
  else if (userAgent.includes('Safari')) device = 'Safari';
  else if (userAgent.includes('Firefox')) device = 'Firefox';
  else if (userAgent.includes('Edge')) device = 'Edge';
  
  if (userAgent.includes('Windows')) device += ' on Windows';
  else if (userAgent.includes('Mac')) device += ' on Mac';
  else if (userAgent.includes('Linux')) device += ' on Linux';
  else if (userAgent.includes('Android')) device += ' on Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) device += ' on iOS';
  
  return device;
};

// Get IP address (would need backend support in production)
const getIpAddress = () => {
  // In production, this would come from the backend
  return 'Current Session';
};

export function useSecurityPreferences() {
  // Get auth context - but handle case where it might not be available
  const authContext = useContext(AuthContext);
  const { toast } = useToast();
  const [isLocked, setIsLocked] = useState(false);
  
  const [preferences, setPreferences] = useState<SecurityPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultPreferences, ...parsed, activityLog: parsed.activityLog || [] };
      }
    } catch (error) {
      console.error('Failed to load security preferences:', error);
    }
    return { ...defaultPreferences, activityLog: [] };
  });

  const [sessionWarningActive, setSessionWarningActive] = useState(false);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState<number | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save security preferences:', error);
    }
  }, [preferences]);

  // Update a single preference
  const updatePreference = useCallback(<K extends keyof SecurityPreferences>(
    key: K,
    value: SecurityPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple preferences at once
  const updatePreferences = useCallback((updates: Partial<SecurityPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset to default preferences
  const resetPreferences = useCallback(() => {
    const newPrefs = { ...defaultPreferences, activityLog: preferences.activityLog };
    setPreferences(newPrefs);
    setSessionWarningActive(false);
    setTimeUntilTimeout(null);
  }, [preferences.activityLog]);

  // Add activity log entry
  const addActivityLogEntry = useCallback((entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    setPreferences(prev => ({
      ...prev,
      activityLog: [newEntry, ...prev.activityLog].slice(0, 10) // Keep only last 10 entries
    }));
  }, []);

  // Clear activity log
  const clearActivityLog = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      activityLog: []
    }));
  }, []);

  // Update last activity time
  const updateLastActivity = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      lastActivityTime: Date.now()
    }));
    
    // Reset warning if it was active
    if (sessionWarningActive) {
      setSessionWarningActive(false);
      setTimeUntilTimeout(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [sessionWarningActive]);

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    if (preferences.autoLock) {
      // Lock the screen instead of logging out
      setIsLocked(true);
      addActivityLogEntry({
        type: 'logout',
        ipAddress: getIpAddress(),
        device: getDeviceInfo(),
        success: true,
        details: 'Auto-locked due to inactivity'
      });
      
      toast({
        title: "Session Locked",
        description: "Your session has been locked due to inactivity. Please enter your password to continue.",
        variant: "default"
      });
    } else {
      // Actually log out the user
      addActivityLogEntry({
        type: 'logout',
        ipAddress: getIpAddress(),
        device: getDeviceInfo(),
        success: true,
        details: 'Session timeout'
      });
      
      // If auth context is available, use it to logout
      if (authContext?.logout) {
        authContext.logout();
      } else {
        // Fallback to redirect
        window.location.href = '/login';
      }
    }
    
    // Clear warning state
    setSessionWarningActive(false);
    setTimeUntilTimeout(null);
  }, [preferences.autoLock, addActivityLogEntry, authContext, toast]);

  // Show session warning
  const showSessionWarning = useCallback(() => {
    setSessionWarningActive(true);
    const warningTimeMs = preferences.warningTime * 60 * 1000;
    setTimeUntilTimeout(warningTimeMs);
    
    // Start countdown
    let timeLeft = warningTimeMs;
    countdownIntervalRef.current = setInterval(() => {
      timeLeft -= 1000;
      if (timeLeft <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        handleSessionTimeout();
      } else {
        setTimeUntilTimeout(timeLeft);
      }
    }, 1000);
  }, [preferences.warningTime, handleSessionTimeout]);

  // Check for session timeout
  const checkSessionTimeout = useCallback(() => {
    if (preferences.sessionTimeout <= 0 || preferences.rememberMe) {
      return;
    }

    const now = Date.now();
    const timeSinceLastActivity = now - preferences.lastActivityTime;
    const timeoutMs = preferences.sessionTimeout * 60 * 1000;
    const warningTimeMs = preferences.warningTime * 60 * 1000;

    if (timeSinceLastActivity >= timeoutMs) {
      handleSessionTimeout();
    } else if (
      preferences.showWarningBeforeTimeout &&
      !sessionWarningActive &&
      timeSinceLastActivity >= (timeoutMs - warningTimeMs)
    ) {
      showSessionWarning();
    }
  }, [
    preferences.sessionTimeout,
    preferences.rememberMe,
    preferences.lastActivityTime,
    preferences.warningTime,
    preferences.showWarningBeforeTimeout,
    sessionWarningActive,
    handleSessionTimeout,
    showSessionWarning
  ]);

  // Set up activity tracking and session timeout checking
  useEffect(() => {
    if (!preferences.enableActivityLogging || preferences.sessionTimeout <= 0 || preferences.rememberMe) {
      return;
    }

    // Track user activity
    const handleActivity = () => {
      updateLastActivity();
    };

    // Add event listeners
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Check for timeout periodically
    const checkInterval = setInterval(checkSessionTimeout, 10000); // Check every 10 seconds

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(checkInterval);
      
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [
    preferences.enableActivityLogging,
    preferences.sessionTimeout,
    preferences.rememberMe,
    checkSessionTimeout,
    updateLastActivity
  ]);

  // Generate backup codes (mock implementation)
  const generateBackupCodes = useCallback(() => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    updatePreference('backupCodesGenerated', true);
    return codes;
  }, [updatePreference]);

  // Validate password complexity
  const validatePasswordComplexity = useCallback((password: string): boolean => {
    switch (preferences.passwordComplexityLevel) {
      case 'basic':
        return password.length >= 8;
      case 'moderate':
        return (
          password.length >= 10 &&
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password)
        );
      case 'strong':
        return (
          password.length >= 12 &&
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[!@#$%^&*(),.?":{}|<>]/.test(password)
        );
      default:
        return true;
    }
  }, [preferences.passwordComplexityLevel]);

  // Get password complexity requirements
  const getPasswordRequirements = useCallback((): string[] => {
    switch (preferences.passwordComplexityLevel) {
      case 'basic':
        return ['At least 8 characters'];
      case 'moderate':
        return [
          'At least 10 characters',
          'One uppercase letter',
          'One lowercase letter',
          'One number'
        ];
      case 'strong':
        return [
          'At least 12 characters',
          'One uppercase letter',
          'One lowercase letter',
          'One number',
          'One special character'
        ];
      default:
        return [];
    }
  }, [preferences.passwordComplexityLevel]);

  // Add trusted device
  const addTrustedDevice = useCallback((deviceId: string) => {
    setPreferences(prev => ({
      ...prev,
      trustedDevices: [...prev.trustedDevices, deviceId]
    }));
  }, []);

  // Remove trusted device
  const removeTrustedDevice = useCallback((deviceId: string) => {
    setPreferences(prev => ({
      ...prev,
      trustedDevices: prev.trustedDevices.filter(id => id !== deviceId)
    }));
  }, []);

  // Add IP to whitelist
  const addIpToWhitelist = useCallback((ip: string) => {
    setPreferences(prev => ({
      ...prev,
      ipWhitelist: [...prev.ipWhitelist, ip]
    }));
  }, []);

  // Remove IP from whitelist
  const removeIpFromWhitelist = useCallback((ip: string) => {
    setPreferences(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(item => item !== ip)
    }));
  }, []);

  // Handle unlock
  const unlockSession = useCallback(() => {
    setIsLocked(false);
    updateLastActivity();
    addActivityLogEntry({
      type: 'access_attempt',
      ipAddress: getIpAddress(),
      device: getDeviceInfo(),
      success: true,
      details: 'Session unlocked successfully'
    });
    toast({
      title: "Session Unlocked",
      description: "Welcome back! Your session has been restored.",
      variant: "default"
    });
  }, [updateLastActivity, addActivityLogEntry, toast]);

  // Load activity log from backend on mount
  useEffect(() => {
    const loadActivityLog = async () => {
      try {
        const response = await apiRequest('/auth/activity-log');
        if (response && response.activities) {
          setPreferences(prev => ({
            ...prev,
            activityLog: response.activities
          }));
        }
      } catch (error) {
        // API might not be available yet, use local storage only
        console.debug('Activity log API not available, using local storage');
      }
    };
    
    // Only load if authenticated
    if (authContext?.isAuthenticated) {
      loadActivityLog();
    }
  }, [authContext?.isAuthenticated]);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    addActivityLogEntry,
    clearActivityLog,
    updateLastActivity,
    sessionWarningActive,
    timeUntilTimeout,
    generateBackupCodes,
    validatePasswordComplexity,
    getPasswordRequirements,
    addTrustedDevice,
    removeTrustedDevice,
    addIpToWhitelist,
    removeIpFromWhitelist,
    isLocked,
    unlockSession,
    getDeviceInfo,
    getIpAddress
  };
}