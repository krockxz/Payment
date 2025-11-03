'use client';

import { useEffect } from 'react';

/**
 * Component to suppress specific development warnings that come from third-party libraries
 * and cannot be fixed in our codebase.
 */
export function WarningSuppressor() {
  useEffect(() => {
    // Only run in development and in the browser
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const originalWarn = console.warn;
      const originalError = console.error;

      // Suppress the JSX transform warning from third-party libraries
      console.warn = (...args) => {
        const message = args[0]?.toString() || '';

        // Suppress specific warnings that come from third-party dependencies
        if (
          message.includes('outdated JSX transform') ||
          message.includes('installHook.js') ||
          (message.includes('uncontrollable') && message.includes('createElement'))
        ) {
          return; // Suppress these specific warnings
        }

        // Call original warn for other messages
        originalWarn.apply(console, args);
      };

      // Suppress specific React errors that are expected from third-party libraries
      console.error = (...args) => {
        const message = args[0]?.toString() || '';

        // Only suppress specific known issues from third-party libraries
        if (
          message.includes('uncontrollable') &&
          message.includes('JSX transform')
        ) {
          return; // Suppress this specific third-party library warning
        }

        // Call original error for other messages
        originalError.apply(console, args);
      };

      // Cleanup function to restore original console methods
      return () => {
        console.warn = originalWarn;
        console.error = originalError;
      };
    }
  }, []);

  // This component doesn't render anything
  return null;
}