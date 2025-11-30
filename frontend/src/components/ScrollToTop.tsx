import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Smart scroll behavior:
 * - Link click / New navigation → Scroll to top smoothly
 * - Browser back/forward button → Restore exact previous scroll position
 * - Works perfectly with React Router navigation
 */

interface ScrollPosition {
  [key: string]: number;
}

// Store scroll positions for all visited routes
const scrollPositions: ScrollPosition = {};

const ScrollToTop = () => {
  const location = useLocation();
  const lastPathnameRef = useRef<string>('');
  const isInitialMount = useRef(true);

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastPathnameRef.current = currentPath;
      return;
    }

    // Detect if this is back/forward navigation
    const isBackForward = window.history.state?.idx !== undefined && 
                          window.history.state?.idx !== window.history.length - 1;

    if (isBackForward && scrollPositions[currentPath] !== undefined) {
      // Back/forward: Restore previous scroll position
      const savedPosition = scrollPositions[currentPath];
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          left: 0,
          behavior: 'auto' // Instant scroll for back/forward (native browser behavior)
        });
        console.log(`🔙 Back/Forward: Restored scroll to ${savedPosition}px for ${currentPath}`);
      });
    } else {
      // New navigation: Scroll to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth' // Smooth scroll for new page
      });
      console.log(`🔝 New page: Scrolled to top for ${currentPath}`);
    }

    // Update last pathname
    lastPathnameRef.current = currentPath;

    // Track scroll position changes
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce scroll position saving
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrollPositions[currentPath] = window.scrollY;
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      // Save final scroll position when leaving
      clearTimeout(scrollTimeout);
      scrollPositions[currentPath] = window.scrollY;
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, location.search]);

  return null;
};

export default ScrollToTop;
