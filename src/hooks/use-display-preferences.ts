import { useState, useEffect, useCallback } from 'react';
import { format, parse } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12' | '24';
export type TableViewMode = 'compact' | 'comfortable';
export type TimeZone = 'UTC' | 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles' | 'Europe/London' | 'Europe/Paris' | 'Asia/Tokyo' | 'Australia/Sydney';

export interface DisplayPreferences {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timeZone: TimeZone;
  itemsPerPage: number;
  tableViewMode: TableViewMode;
}

const STORAGE_KEY = 'physician-crm-display-preferences';

const DEFAULT_PREFERENCES: DisplayPreferences = {
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12',
  timeZone: 'America/New_York',
  itemsPerPage: 25,
  tableViewMode: 'comfortable',
};

// Date format patterns for date-fns
const DATE_FORMAT_PATTERNS: Record<DateFormat, string> = {
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

export function useDisplayPreferences() {
  const [preferences, setPreferences] = useState<DisplayPreferences>(() => {
    // Load preferences from localStorage on initial mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load display preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save display preferences:', error);
    }
  }, [preferences]);

  // Update a single preference
  const updatePreference = useCallback(<K extends keyof DisplayPreferences>(
    key: K,
    value: DisplayPreferences[K]
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Update multiple preferences at once
  const updatePreferences = useCallback((updates: Partial<DisplayPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Reset to default preferences
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Format a date according to user preferences
  const formatDate = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      const pattern = DATE_FORMAT_PATTERNS[preferences.dateFormat];
      return format(dateObj, pattern);
    } catch (error) {
      console.error('Failed to format date:', error);
      return '';
    }
  }, [preferences.dateFormat]);

  // Format a date with time according to user preferences
  const formatDateTime = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      const datePattern = DATE_FORMAT_PATTERNS[preferences.dateFormat];
      const timePattern = preferences.timeFormat === '12' ? 'h:mm a' : 'HH:mm';
      
      // Format in the user's selected timezone
      if (preferences.timeZone !== 'UTC') {
        const zonedDate = toZonedTime(dateObj, preferences.timeZone);
        return `${format(zonedDate, datePattern)} ${format(zonedDate, timePattern)}`;
      }
      
      return `${format(dateObj, datePattern)} ${format(dateObj, timePattern)}`;
    } catch (error) {
      console.error('Failed to format datetime:', error);
      return '';
    }
  }, [preferences.dateFormat, preferences.timeFormat, preferences.timeZone]);

  // Format time only according to user preferences
  const formatTime = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      const pattern = preferences.timeFormat === '12' ? 'h:mm a' : 'HH:mm';
      
      // Format in the user's selected timezone
      if (preferences.timeZone !== 'UTC') {
        const zonedDate = toZonedTime(dateObj, preferences.timeZone);
        return format(zonedDate, pattern);
      }
      
      return format(dateObj, pattern);
    } catch (error) {
      console.error('Failed to format time:', error);
      return '';
    }
  }, [preferences.timeFormat, preferences.timeZone]);

  // Get table row class based on view mode
  const getTableRowClass = useCallback((): string => {
    return preferences.tableViewMode === 'compact' 
      ? 'h-10' 
      : 'h-14';
  }, [preferences.tableViewMode]);

  // Get table cell padding class based on view mode
  const getTableCellClass = useCallback((): string => {
    return preferences.tableViewMode === 'compact'
      ? 'px-3 py-2'
      : 'px-4 py-3';
  }, [preferences.tableViewMode]);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    formatDate,
    formatDateTime,
    formatTime,
    getTableRowClass,
    getTableCellClass,
  };
}