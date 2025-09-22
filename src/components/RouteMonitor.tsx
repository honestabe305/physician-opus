import { useLocation } from "wouter";
import { useEffect, useRef } from "react";

interface RouteMonitorProps {
  children: React.ReactNode;
}

// Route validation patterns
const SUSPICIOUS_PATTERNS = [
  { pattern: /^\/\d+\/?$/, name: "numeric-only-path" },
  { pattern: /^\/0\/?$/, name: "zero-path" },
  { pattern: /^\/\d+\/\d+\/?$/, name: "double-numeric" },
  { pattern: /^\/undefined\/?$/, name: "undefined-path" },
  { pattern: /^\/null\/?$/, name: "null-path" },
  { pattern: /^\/\[object Object\]\/?$/, name: "object-toString" },
];

const VALID_PATHS = [
  "/",
  "/login",
  "/signup",
  "/physicians",
  "/physicians/new",
  "/search",
  "/demographics",
  "/contact",
  "/practice",
  "/licensure",
  "/dea-csr",
  "/education",
  "/work-history",
  "/documents",
  "/document-management",
  "/renewal-workflows",
  "/analytics",
  "/settings",
  "/help",
  // Payer Enrollment Routes
  "/payer-enrollment",
  "/payer-enrollment/payers",
  "/payer-enrollment/enrollments",
  "/payer-enrollment/practice-locations",
  "/payer-enrollment/banking",
  "/payer-enrollment/references",
];

// Valid dynamic route patterns
const VALID_DYNAMIC_PATTERNS = [
  { pattern: /^\/physicians\/[a-zA-Z0-9\-_]+\/?$/, name: "physician-profile" },
  { pattern: /^\/physicians\/[a-zA-Z0-9\-_]+\/edit\/?$/, name: "physician-edit" },
  { pattern: /^\/physicians\/[a-zA-Z0-9\-_]+\/documents\/?$/, name: "physician-documents" },
  { pattern: /^\/document-management\/[a-zA-Z0-9\-_]+\/?$/, name: "document-management-physician" },
];

/**
 * Captures a stack trace for debugging navigation sources
 */
function captureStackTrace(): string {
  const stack = new Error().stack || "";
  return stack
    .split('\n')
    .slice(1) // Remove the Error line
    .filter(line => 
      !line.includes('RouteMonitor') && 
      !line.includes('useEffect') &&
      !line.includes('scheduler')
    )
    .slice(0, 10) // Limit to 10 lines
    .join('\n');
}

/**
 * Checks if a path matches any suspicious patterns
 */
function validateRoute(path: string): { isValid: boolean; suspiciousPattern?: string; reason?: string } {
  // Check against known valid static paths first
  if (VALID_PATHS.includes(path)) {
    return { isValid: true };
  }

  // Check against valid dynamic route patterns
  for (const { pattern, name } of VALID_DYNAMIC_PATTERNS) {
    if (pattern.test(path)) {
      return { isValid: true };
    }
  }

  // Check against suspicious patterns
  for (const { pattern, name } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(path)) {
      return { 
        isValid: false, 
        suspiciousPattern: name,
        reason: `Path "${path}" matches suspicious pattern: ${pattern.toString()}`
      };
    }
  }

  // If not in valid paths, not valid dynamic pattern, and not suspicious, it's just a 404
  return { isValid: false, reason: `Path "${path}" not found in valid routes` };
}

/**
 * Logs detailed navigation information
 */
function logNavigation(path: string, previousPath: string | null) {
  const timestamp = new Date().toISOString();
  const validation = validateRoute(path);
  const stackTrace = captureStackTrace();

  const logData = {
    timestamp,
    path,
    previousPath,
    validation,
    userAgent: navigator.userAgent,
    url: window.location.href,
    referrer: document.referrer,
    stackTrace
  };

  if (!validation.isValid) {
    console.group(`🚨 ROUTE ERROR: Invalid navigation to "${path}"`);
    console.error("Navigation Details:", logData);
    
    if (validation.suspiciousPattern) {
      console.error(`⚠️  SUSPICIOUS PATTERN DETECTED: ${validation.suspiciousPattern}`);
      console.error(`Reason: ${validation.reason}`);
    }
    
    console.error("🔍 Stack Trace:");
    console.error(stackTrace);
    console.groupEnd();

    // Also send to any external logging service if configured
    if (import.meta.env.VITE_LOG_ENDPOINT) {
      fetch(import.meta.env.VITE_LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'route_error', data: logData })
      }).catch(err => console.warn('Failed to send log to external service:', err));
    }
  } else {
    // Log successful navigation for debugging (can be disabled in production)
    if (import.meta.env.DEV) {
      console.log(`✅ Navigation: ${previousPath || '(initial)'} → ${path}`);
    }
  }
}

/**
 * Route Monitor Component
 * Tracks all route changes and provides detailed logging for debugging navigation issues
 */
export function RouteMonitor({ children }: RouteMonitorProps) {
  const [location] = useLocation();
  const previousLocationRef = useRef<string | null>(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    // Skip logging for the initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      previousLocationRef.current = location;
      return;
    }

    // Log the navigation
    logNavigation(location, previousLocationRef.current);
    
    // Update previous location
    previousLocationRef.current = location;
  }, [location]);

  // Monitor for programmatic navigation attempts
  useEffect(() => {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(state, title, url) {
      const urlString = url?.toString() || '';
      console.log(`📍 History pushState called:`, { state, title, url: urlString });
      
      if (urlString.includes('/0/') || urlString.endsWith('/0')) {
        console.error(`🚨 DETECTED: Attempt to navigate to suspicious URL via pushState:`, urlString);
        console.error('Stack trace:', captureStackTrace());
      }
      
      return originalPushState.apply(this, arguments);
    };

    history.replaceState = function(state, title, url) {
      const urlString = url?.toString() || '';
      console.log(`📍 History replaceState called:`, { state, title, url: urlString });
      
      if (urlString.includes('/0/') || urlString.endsWith('/0')) {
        console.error(`🚨 DETECTED: Attempt to navigate to suspicious URL via replaceState:`, urlString);
        console.error('Stack trace:', captureStackTrace());
      }
      
      return originalReplaceState.apply(this, arguments);
    };

    // Monitor popstate events
    const handlePopState = (event: PopStateEvent) => {
      console.log(`📍 PopState event:`, { state: event.state, url: window.location.href });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return <>{children}</>;
}

export default RouteMonitor;