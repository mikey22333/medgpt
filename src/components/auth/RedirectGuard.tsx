"use client";

import { useEffect } from 'react';

/**
 * Component to prevent localhost redirects on production sites
 * This runs on the client side to catch any missed localhost redirects
 */
export function RedirectGuard() {
  useEffect(() => {
    // Run on both development and production to catch any localhost redirects
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      const hostname = window.location.hostname;
      
      // If we're on production domain but URL contains localhost, fix it immediately
      if (hostname === 'clinisynth.onrender.com' || (hostname !== 'localhost' && hostname !== '127.0.0.1')) {
        if (currentUrl.includes('localhost:3000') || currentUrl.includes('127.0.0.1:3000')) {
          console.warn('🚨 CRITICAL: Detected localhost redirect on production domain!');
          console.log('Current URL:', currentUrl);
          console.log('Hostname:', hostname);
          
          const fixedUrl = currentUrl
            .replace(/http:\/\/localhost:3000/g, `https://${hostname}`)
            .replace(/https:\/\/localhost:3000/g, `https://${hostname}`)
            .replace(/http:\/\/127\.0\.0\.1:3000/g, `https://${hostname}`)
            .replace(/https:\/\/127\.0\.0\.1:3000/g, `https://${hostname}`);
          
          console.log('Redirecting to fixed URL:', fixedUrl);
          window.location.replace(fixedUrl);
          return;
        }
      }
      
      // Additional check for mixed localhost/production URLs
      if (currentUrl.includes('localhost') && !hostname.includes('localhost')) {
        console.warn('🔧 Fixing mixed localhost/production URL');
        const cleanUrl = currentUrl.replace(/localhost:3000/g, hostname);
        window.location.replace(cleanUrl);
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
