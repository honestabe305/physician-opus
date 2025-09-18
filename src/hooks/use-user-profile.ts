import { useState, useEffect, useCallback } from "react";

/**
 * @deprecated SECURITY WARNING: This hook is deprecated due to security vulnerabilities.
 * 
 * This hook stores user data in localStorage and provides mock/default data,
 * which can lead to security issues and user data bleeding vulnerabilities.
 * 
 * INSTEAD USE: AuthContext (src/contexts/AuthContext.tsx) which provides:
 * - Session-bound user authentication
 * - Secure user profile data
 * - Protection against user data bleeding
 * 
 * This hook will be removed in a future version.
 */
export interface UserProfile {
  // Personal Information
  fullName: string;
  title: string;
  department: "Administration" | "Medical" | "HR" | "IT" | "Compliance" | "";
  employeeId: string;
  profilePhoto: string;
  
  // Contact Information
  email: string;
  phone: string;
  extension: string;
  mobile: string;
  preferredContact: "Email" | "Phone" | "Mobile";
  
  // Professional Details
  role: "Administrator" | "Manager" | "Staff" | "Viewer" | "";
  hireDate: string;
  officeLocation: string;
  supervisor: string;
  licenseNumber: string;
  
  // Additional Settings
  bio: string;
  signature: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const STORAGE_KEY = "physician-crm-user-profile";

// Demo data for initial setup
const DEFAULT_PROFILE: UserProfile = {
  fullName: "Dr. Sarah Johnson",
  title: "Senior Administrator",
  department: "Administration",
  employeeId: "EMP-2024-001",
  profilePhoto: "",
  email: "sarah.johnson@physiciancrm.com",
  phone: "(555) 123-4567",
  extension: "1234",
  mobile: "(555) 987-6543",
  preferredContact: "Email",
  role: "Administrator",
  hireDate: "2022-01-15",
  officeLocation: "Building A, Room 301",
  supervisor: "Michael Chen",
  licenseNumber: "",
  bio: "Experienced healthcare administrator with over 10 years in physician practice management. Specializing in credentialing and compliance.",
  signature: "Dr. Sarah Johnson\nSenior Administrator\nPhysicianCRM",
  emergencyContactName: "John Johnson",
  emergencyContactPhone: "(555) 111-2222"
};

export function useUserProfile() {
  console.warn("🚨 SECURITY WARNING: use-user-profile hook is deprecated due to security vulnerabilities. Use AuthContext instead.");
  
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as UserProfile;
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
    return DEFAULT_PROFILE;
  });

  // Save to localStorage whenever profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  }, [profile]);

  // Update a single field
  const updateField = useCallback(<K extends keyof UserProfile>(
    field: K,
    value: UserProfile[K]
  ) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Update multiple fields at once
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset to default profile
  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
  }, []);

  // Clear all profile data
  const clearProfile = useCallback(() => {
    const emptyProfile: UserProfile = {
      fullName: "",
      title: "",
      department: "",
      employeeId: "",
      profilePhoto: "",
      email: "",
      phone: "",
      extension: "",
      mobile: "",
      preferredContact: "Email",
      role: "",
      hireDate: "",
      officeLocation: "",
      supervisor: "",
      licenseNumber: "",
      bio: "",
      signature: "",
      emergencyContactName: "",
      emergencyContactPhone: ""
    };
    setProfile(emptyProfile);
  }, []);

  // Get formatted display name
  const getDisplayName = useCallback(() => {
    if (profile.fullName) {
      return profile.fullName;
    }
    if (profile.email) {
      return profile.email.split('@')[0];
    }
    return "User";
  }, [profile.fullName, profile.email]);

  // Get initials for avatar
  const getInitials = useCallback(() => {
    if (profile.fullName) {
      return profile.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (profile.email) {
      return profile.email[0].toUpperCase();
    }
    return "U";
  }, [profile.fullName, profile.email]);

  // Validate email format
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validate phone format (US format)
  const validatePhone = useCallback((phone: string): boolean => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  }, []);

  // Format phone number for display
  const formatPhone = useCallback((phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }, []);

  // Get role color for badge
  const getRoleColor = useCallback((role: UserProfile['role']): string => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-500 text-white';
      case 'Manager':
        return 'bg-blue-500 text-white';
      case 'Staff':
        return 'bg-green-500 text-white';
      case 'Viewer':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  }, []);

  // Check if profile is complete
  const isProfileComplete = useCallback(() => {
    const requiredFields: (keyof UserProfile)[] = [
      'fullName',
      'email',
      'department',
      'role'
    ];
    return requiredFields.every(field => profile[field]);
  }, [profile]);

  // Get completion percentage
  const getCompletionPercentage = useCallback(() => {
    const fields = Object.values(profile);
    const filledFields = fields.filter(field => field !== "").length;
    return Math.round((filledFields / fields.length) * 100);
  }, [profile]);

  return {
    profile,
    updateField,
    updateProfile,
    resetProfile,
    clearProfile,
    getDisplayName,
    getInitials,
    validateEmail,
    validatePhone,
    formatPhone,
    getRoleColor,
    isProfileComplete,
    getCompletionPercentage
  };
}