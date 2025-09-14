import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

/**
 * Captures detailed error information for 404 routes
 */
function captureErrorDetails(path: string) {
  const timestamp = new Date().toISOString();
  const stackTrace = new Error().stack || "";
  
  return {
    timestamp,
    path,
    url: window.location.href,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    stackTrace: stackTrace
      .split('\n')
      .slice(1)
      .filter(line => 
        !line.includes('NotFound') && 
        !line.includes('useEffect') &&
        !line.includes('scheduler')
      )
      .slice(0, 8)
      .join('\n'),
    sessionStorage: {
      length: sessionStorage.length,
      keys: Object.keys(sessionStorage)
    },
    localStorage: {
      length: localStorage.length,
      keys: Object.keys(localStorage)
    }
  };
}

const NotFound = () => {
  const [location] = useLocation();
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    const details = captureErrorDetails(location);
    setErrorDetails(details);

    // Enhanced error logging with more context
    console.group(`🚨 404 ERROR: Route not found "${location}"`);
    console.error("Enhanced 404 Error Details:", details);
    
    // Check if this is a suspicious pattern
    const suspiciousPatterns = [
      { pattern: /^\/\d+\/?$/, name: "numeric-only-path" },
      { pattern: /^\/0\/?$/, name: "zero-path" },
    ];
    
    const suspiciousMatch = suspiciousPatterns.find(({ pattern }) => pattern.test(location));
    if (suspiciousMatch) {
      console.error(`⚠️  SUSPICIOUS PATTERN DETECTED in 404: ${suspiciousMatch.name}`);
      console.error(`Pattern: ${suspiciousMatch.pattern.toString()}`);
    }
    
    console.error("🔍 Stack Trace from NotFound component:");
    console.error(details.stackTrace);
    console.groupEnd();

    // Report to external service if configured
    if (import.meta.env.VITE_ERROR_REPORTING_ENDPOINT) {
      fetch(import.meta.env.VITE_ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: '404_error', 
          data: details,
          isSuspicious: !!suspiciousMatch 
        })
      }).catch(err => console.warn('Failed to report 404 error:', err));
    }
  }, [location]);

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground font-mono break-all">
              Requested: <span className="font-semibold text-foreground">{location}</span>
            </p>
          </div>
          
          {import.meta.env.DEV && errorDetails && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Debug Information (Dev Mode)
              </summary>
              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono max-h-40 overflow-y-auto">
                <div><strong>Timestamp:</strong> {errorDetails.timestamp}</div>
                <div><strong>Referrer:</strong> {errorDetails.referrer || 'None'}</div>
                <div><strong>URL:</strong> {errorDetails.url}</div>
                {errorDetails.stackTrace && (
                  <div className="mt-2">
                    <strong>Stack Trace:</strong>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">{errorDetails.stackTrace}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
        
        <CardFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={goBack} 
            className="flex-1"
            data-testid="button-go-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button 
            onClick={goHome} 
            className="flex-1"
            data-testid="button-go-home"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotFound;
