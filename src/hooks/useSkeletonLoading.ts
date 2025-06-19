import { useState, useEffect } from 'react';

/**
 * Custom hook for managing skeleton loading states with minimum display time
 * This ensures skeletons are shown for at least a minimum duration to prevent flashing
 */
export const useSkeletonLoading = (
  isLoading: boolean,
  minDisplayTime: number = 500 // minimum time in milliseconds
) => {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && !startTime) {
      // Start loading - record the start time
      setStartTime(Date.now());
      setShowSkeleton(true);
    } else if (!isLoading && startTime) {
      // Loading finished - check if minimum time has passed
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      if (remainingTime > 0) {
        // Wait for the remaining time before hiding skeleton
        const timer = setTimeout(() => {
          setShowSkeleton(false);
          setStartTime(null);
        }, remainingTime);

        return () => clearTimeout(timer);
      } else {
        // Minimum time already passed, hide immediately
        setShowSkeleton(false);
        setStartTime(null);
      }
    }
  }, [isLoading, startTime, minDisplayTime]);

  return showSkeleton;
};

/**
 * Hook for managing staggered skeleton loading
 * Useful for lists where you want skeletons to appear with a slight delay between items
 */
export const useStaggeredSkeleton = (
  isLoading: boolean,
  itemCount: number,
  staggerDelay: number = 100
) => {
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setVisibleItems(0);
      
      // Stagger the appearance of skeleton items
      const timers: NodeJS.Timeout[] = [];
      
      for (let i = 0; i < itemCount; i++) {
        const timer = setTimeout(() => {
          setVisibleItems(prev => prev + 1);
        }, i * staggerDelay);
        
        timers.push(timer);
      }

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    } else {
      setVisibleItems(itemCount);
    }
  }, [isLoading, itemCount, staggerDelay]);

  return visibleItems;
};

/**
 * Hook for managing skeleton loading with fade transitions
 */
export const useSkeletonTransition = (
  isLoading: boolean,
  transitionDuration: number = 300
) => {
  const [phase, setPhase] = useState<'loading' | 'fadeOut' | 'content'>(
    isLoading ? 'loading' : 'content'
  );

  useEffect(() => {
    if (isLoading) {
      setPhase('loading');
    } else if (phase === 'loading') {
      setPhase('fadeOut');
      
      const timer = setTimeout(() => {
        setPhase('content');
      }, transitionDuration);

      return () => clearTimeout(timer);
    }
  }, [isLoading, phase, transitionDuration]);

  return {
    showSkeleton: phase === 'loading' || phase === 'fadeOut',
    showContent: phase === 'content',
    isTransitioning: phase === 'fadeOut'
  };
};