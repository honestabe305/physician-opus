import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Lock, Unlock, AlertCircle, Loader2, User, Timer, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type UnlockFormData = z.infer<typeof unlockSchema>;

interface LockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  timeUntilTimeout?: number | null;
  sessionWarningActive?: boolean;
}

export default function LockScreen({ isLocked, onUnlock, timeUntilTimeout, sessionWarningActive }: LockScreenProps) {
  const { user, profile } = useAuth();
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const form = useForm<UnlockFormData>({
    resolver: zodResolver(unlockSchema),
    defaultValues: {
      password: '',
    },
  });

  const onSubmit = async (data: UnlockFormData) => {
    setUnlockError(null);
    setIsUnlocking(true);

    try {
      // Verify password with backend
      const response = await apiRequest('/auth/unlock-session', {
        method: 'POST',
        body: JSON.stringify({ password: data.password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response && response.success) {
        // Clear form
        form.reset();
        setFailedAttempts(0);
        // Call unlock callback
        onUnlock();
      } else {
        throw new Error('Invalid password');
      }
    } catch (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setUnlockError('Too many failed attempts. Your session will be terminated for security reasons.');
        // Force logout after 3 failed attempts
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setUnlockError(`Invalid password. ${3 - newAttempts} attempts remaining.`);
      }
      
      form.setFocus('password');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.fullName) {
      const names = profile.fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return profile.fullName.substring(0, 2).toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isLocked) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="lock-screen-overlay"
    >
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.profilePhoto} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 p-2 bg-destructive rounded-full">
                <Lock className="h-4 w-4 text-destructive-foreground" />
              </div>
            </div>
          </div>
          
          <div>
            <CardTitle className="text-2xl">Session Locked</CardTitle>
            <CardDescription className="mt-2">
              <div className="space-y-1">
                <p>Your session has been locked for security</p>
                <p className="font-medium" data-testid="text-locked-user">
                  {profile?.fullName || user?.username || 'User'}
                </p>
              </div>
            </CardDescription>
          </div>

          {/* Session warning or timeout indicator */}
          {sessionWarningActive && timeUntilTimeout && timeUntilTimeout > 0 && (
            <Alert className="border-warning bg-warning/10">
              <Timer className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Session expires in{' '}
                <span className="font-mono font-semibold" data-testid="text-time-remaining">
                  {formatTimeRemaining(timeUntilTimeout)}
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Error Alert */}
              {unlockError && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="text-unlock-error">
                    {unlockError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter your password to unlock</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          autoComplete="current-password"
                          autoFocus
                          disabled={isUnlocking || failedAttempts >= 3}
                          data-testid="input-unlock-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isUnlocking || failedAttempts >= 3}
                data-testid="button-unlock"
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock Session
                  </>
                )}
              </Button>

              {/* Additional Info */}
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Your session is still active but locked for security
                </p>
                {failedAttempts > 0 && failedAttempts < 3 && (
                  <p className="text-xs text-destructive">
                    Failed attempts: {failedAttempts}/3
                  </p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}