import type { User, Profile } from '@/contexts/AuthContext';

/**
 * Shared utility functions for displaying user information consistently
 * across all components. These functions work with user and profile data
 * from AuthContext to ensure consistent display logic.
 */

/**
 * Get the display name for a user, prioritizing profile data over user data
 */
export function getDisplayName(user: User | null, profile: Profile | null): string {
  if (profile?.fullName) return profile.fullName;
  if (user?.username) return user.username;
  if (user?.email) return user.email;
  return 'User';
}

/**
 * Get initials for avatar display, prioritizing profile data over user data
 */
export function getInitials(user: User | null, profile: Profile | null): string {
  if (profile?.fullName) {
    const names = profile.fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
  if (user?.username) {
    return user.username.substring(0, 2).toUpperCase();
  }
  if (user?.email) {
    return user.email[0].toUpperCase();
  }
  return 'U';
}

/**
 * Get the user's role, prioritizing profile role over user role
 */
export function getUserRole(user: User | null, profile: Profile | null): string | undefined {
  return profile?.role || user?.role;
}

/**
 * Get the user's email address, prioritizing profile email over user email
 */
export function getUserEmail(user: User | null, profile: Profile | null): string {
  return profile?.email || user?.email || '';
}

/**
 * Get role-based color classes for badges and styling
 */
export function getRoleColor(role: string | undefined): string {
  if (!role) return 'bg-gray-400 text-white';
  
  const lowerRole = role.toLowerCase();
  switch (lowerRole) {
    case 'admin':
    case 'administrator':
      return 'bg-red-500 text-white';
    case 'manager':
      return 'bg-blue-500 text-white';
    case 'staff':
      return 'bg-green-500 text-white';
    case 'viewer':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

/**
 * Check if user has sufficient profile data for complete display
 */
export function hasCompleteProfile(user: User | null, profile: Profile | null): boolean {
  const displayName = getDisplayName(user, profile);
  const email = getUserEmail(user, profile);
  const role = getUserRole(user, profile);
  
  return displayName !== 'User' && !!email && !!role;
}