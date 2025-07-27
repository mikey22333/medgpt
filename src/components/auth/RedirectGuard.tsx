"use client";

import { useEffect } from 'react';

/**
 * Component to prevent localhost redirects on production sites
 * This runs on the client side to catch any missed localhost redirects
 */
export function RedirectGuard() {
  useEffect(() => {
    // Only run on production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      const currentUrl = window.location.href;
      
      // Check if we're on localhost but should be on production
      if (currentUrl.includes('localhost:3000') || currentUrl.includes('127.0.0.1:3000')) {
        console.warn('Detected localhost redirect on production, attempting to fix...');
        
        // Try to get the correct production URL from referrer or current domain
        const correctDomain = window.location.hostname;
        if (correctDomain && !correctDomain.includes('localhost')) {
          const fixedUrl = currentUrl
            .replace(/http:\/\/localhost:3000/g, `https://${correctDomain}`)
            .replace(/https:\/\/localhost:3000/g, `https://${correctDomain}`)
            .replace(/http:\/\/127\.0\.0\.1:3000/g, `https://${correctDomain}`)
            .replace(/https:\/\/127\.0\.0\.1:3000/g, `https://${correctDomain}`);
          
          if (fixedUrl !== currentUrl) {
            console.log('Redirecting to fixed URL:', fixedUrl);
            window.location.replace(fixedUrl);
          }
        }
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
