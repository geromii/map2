"use client";
import { useEffect } from 'react';

export function MatrixPreloader() {
  useEffect(() => {
    // Start preloading the matrix data as soon as the component mounts
    // This happens early in the app lifecycle
    if (typeof window !== 'undefined' && !sessionStorage.getItem('mapDesign')) {
      // Create a link preload hint
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'fetch';
      link.href = '/map_design_2025_08.json';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      // Also start the actual fetch in the background
      // This won't block rendering but will warm up the cache
      fetch('/map_design_2025_08.json', {
        priority: 'low', // Use low priority to not interfere with critical resources
        headers: {
          'Accept-Encoding': 'gzip, deflate, br'
        }
      })
      .then(response => response.json())
      .then(matrix => {
        try {
          sessionStorage.setItem('mapDesign', JSON.stringify(matrix));
        } catch (e) {
          console.warn('Failed to cache matrix data:', e);
        }
      })
      .catch(error => {
        console.warn('Background matrix preload failed:', error);
      });
    }
  }, []);

  return null; // This component doesn't render anything
}