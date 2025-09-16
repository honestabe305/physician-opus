import { useState, useEffect, useCallback } from 'react';

export interface NotificationPreferences {
  // Credential Expiration Alerts
  credentialExpiration: {
    enabled: boolean;
    warningPeriod: 15 | 30 | 60 | 90; // days before expiration
    methods: {
      email: boolean;
      inApp: boolean;
      sms: boolean;
    };
  };
  
  // License Renewal Reminders
  licenseRenewal: {
    enabled: boolean;
    monitoredStates: string[]; // State abbreviations
    frequency: 'weekly' | 'biweekly' | 'monthly';
  };
  
  // Document Upload Reminders
  documentUpload: {
    enabled: boolean;
    daysAfterRequest: 1 | 3 | 7 | 14; // days after initial request
  };
  
  // Daily/Weekly Digest
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    sendTime: string; // HH:MM format
    weekDay?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  };
}

const STORAGE_KEY = 'physician-crm-notification-preferences';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  credentialExpiration: {
    enabled: true,
    warningPeriod: 30,
    methods: {
      email: true,
      inApp: true,
      sms: false,
    },
  },
  licenseRenewal: {
    enabled: true,
    monitoredStates: [],
    frequency: 'monthly',
  },
  documentUpload: {
    enabled: true,
    daysAfterRequest: 7,
  },
  digest: {
    enabled: false,
    frequency: 'weekly',
    sendTime: '09:00',
    weekDay: 'monday',
  },
};

// Common US states where physicians typically hold licenses
export const COMMON_MEDICAL_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'NY', name: 'New York' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'IL', name: 'Illinois' },
  { code: 'OH', name: 'Ohio' },
  { code: 'GA', name: 'Georgia' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'MI', name: 'Michigan' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'IN', name: 'Indiana' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MO', name: 'Missouri' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'CO', name: 'Colorado' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'AL', name: 'Alabama' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'OR', name: 'Oregon' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'UT', name: 'Utah' },
];

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }, [preferences]);

  // Update entire preferences
  const updatePreferences = useCallback((newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
  }, []);

  // Update credential expiration settings
  const updateCredentialExpiration = useCallback((updates: Partial<NotificationPreferences['credentialExpiration']>) => {
    setPreferences(prev => ({
      ...prev,
      credentialExpiration: {
        ...prev.credentialExpiration,
        ...updates,
        methods: updates.methods ? {
          ...prev.credentialExpiration.methods,
          ...updates.methods,
        } : prev.credentialExpiration.methods,
      },
    }));
  }, []);

  // Update license renewal settings
  const updateLicenseRenewal = useCallback((updates: Partial<NotificationPreferences['licenseRenewal']>) => {
    setPreferences(prev => ({
      ...prev,
      licenseRenewal: {
        ...prev.licenseRenewal,
        ...updates,
      },
    }));
  }, []);

  // Update document upload settings
  const updateDocumentUpload = useCallback((updates: Partial<NotificationPreferences['documentUpload']>) => {
    setPreferences(prev => ({
      ...prev,
      documentUpload: {
        ...prev.documentUpload,
        ...updates,
      },
    }));
  }, []);

  // Update digest settings
  const updateDigest = useCallback((updates: Partial<NotificationPreferences['digest']>) => {
    setPreferences(prev => ({
      ...prev,
      digest: {
        ...prev.digest,
        ...updates,
      },
    }));
  }, []);

  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Get count of enabled notification types
  const getEnabledCount = useCallback(() => {
    let count = 0;
    if (preferences.credentialExpiration.enabled) count++;
    if (preferences.licenseRenewal.enabled) count++;
    if (preferences.documentUpload.enabled) count++;
    if (preferences.digest.enabled) count++;
    return count;
  }, [preferences]);

  // Get summary of enabled notification methods
  const getEnabledMethods = useCallback(() => {
    const methods: string[] = [];
    if (preferences.credentialExpiration.enabled) {
      if (preferences.credentialExpiration.methods.email) methods.push('Email');
      if (preferences.credentialExpiration.methods.inApp) methods.push('In-App');
      if (preferences.credentialExpiration.methods.sms) methods.push('SMS');
    }
    return [...new Set(methods)]; // Remove duplicates
  }, [preferences]);

  // Check if any notifications are enabled
  const hasEnabledNotifications = useCallback(() => {
    return preferences.credentialExpiration.enabled ||
           preferences.licenseRenewal.enabled ||
           preferences.documentUpload.enabled ||
           preferences.digest.enabled;
  }, [preferences]);

  return {
    preferences,
    updatePreferences,
    updateCredentialExpiration,
    updateLicenseRenewal,
    updateDocumentUpload,
    updateDigest,
    resetPreferences,
    getEnabledCount,
    getEnabledMethods,
    hasEnabledNotifications,
  };
}