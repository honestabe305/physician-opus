import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import PageLoader from '@/components/PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      // Store the current location to redirect back after login
      const currentPath = location !== '/login' ? location : '/';
      setLocation(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    
    // If user is authenticated but doesn't have required admin role
    if (!isLoading && isAuthenticated && requireAdmin && user?.role !== 'admin') {
      setLocation('/');
    }
  }, [isLoading, isAuthenticated, location, setLocation, requireAdmin, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  // If not authenticated, don't render children (will redirect in useEffect)
  if (!isAuthenticated) {
    return <PageLoader />;
  }

  // If requires admin and user is not admin, don't render
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // User is authenticated (and is admin if required), render children
  return <>{children}</>;
}