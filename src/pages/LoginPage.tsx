import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Heart,
  Shield,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Form validation schema
const loginFormSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      // Clear any previous errors
      setLoginError(null);
      
      // Store user data if needed (typically handled by cookies from the server)
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      toast({
        title: "Login successful",
        description: "Welcome back to PhysicianCRM",
      });

      // Redirect to dashboard or requested page
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
      setLocation(redirectTo);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      // Set specific error messages based on the error
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401')) {
        setLoginError("Invalid email or password. Please try again.");
      } else if (errorMessage.includes('locked') || errorMessage.includes('403')) {
        setLoginError("Your account has been locked due to multiple failed login attempts. Please contact support.");
      } else if (errorMessage.includes('deactivated')) {
        setLoginError("Your account has been deactivated. Please contact your administrator.");
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setLoginError("Unable to connect to the server. Please check your internet connection and try again.");
      } else {
        setLoginError(errorMessage);
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    // Clear previous errors on new submission
    setLoginError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title Section */}
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-6 w-6 text-primary/80" />
              <Activity className="h-6 w-6 text-primary/60" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-app-title">
            PhysicianCRM
          </h1>
          <p className="text-muted-foreground">
            Secure Healthcare Provider Management System
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to access your physician management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Error Alert */}
                {loginError && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription data-testid="text-error-message">
                      {loginError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10"
                            autoComplete="email"
                            autoFocus
                            data-testid="input-email"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10"
                            autoComplete="current-password"
                            data-testid="input-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-remember-me"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm text-primary hover:text-primary/80"
                    onClick={() => {
                      toast({
                        title: "Password Reset",
                        description: "Password reset functionality coming soon. Please contact your administrator.",
                      });
                    }}
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </Button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-submit"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <div className="text-center w-full space-y-2">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to comply with HIPAA regulations and maintain patient confidentiality
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Secure Login
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Encrypted Connection
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Support Section */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact support at{" "}
            <a
              href="mailto:support@physiciancrm.com"
              className="text-primary hover:underline"
              data-testid="link-support-email"
            >
              support@physiciancrm.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}