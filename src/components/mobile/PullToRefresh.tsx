import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const TRIGGER_THRESHOLD = 64;
const MAX_PULL_DISTANCE = 108;

function hasScrolledNestedElement(target: EventTarget | null, root: HTMLElement | null): boolean {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== root) {
    if (node.scrollTop > 0) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = ''
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const resetPull = useCallback(() => {
    startYRef.current = null;
    startXRef.current = null;
    pullingRef.current = false;
    pullDistanceRef.current = 0;
    setIsPulling(false);
    setPullDistance(0);
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setIsPulling(false);
    setPullDistance(54);
    pullDistanceRef.current = 54;

    const minDelay = new Promise((resolve) => setTimeout(resolve, 450));
    try {
      await Promise.all([onRefresh(), minDelay]);
    } finally {
      setIsRefreshing(false);
      resetPull();
    }
  }, [isRefreshing, onRefresh, resetPull]);

  const handleStart = (clientY: number, clientX: number, target: EventTarget | null, isMouse = false) => {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 1) return;
    if (hasScrolledNestedElement(target, container)) return;

    if (isMouse && target instanceof HTMLElement) {
      if (target.closest('input, textarea, select, button, a, [role="button"]')) {
        return;
      }
    }

    startYRef.current = clientY;
    startXRef.current = clientX;
    pullingRef.current = true;
    setIsPulling(true);
  };

  const handleMove = (clientY: number, clientX: number): boolean => {
    if (!pullingRef.current || startYRef.current === null || startXRef.current === null || isRefreshing) {
      return false;
    }

    const container = containerRef.current;
    if (!container || container.scrollTop > 1) {
      resetPull();
      return false;
    }

    const deltaY = clientY - startYRef.current;
    const deltaX = Math.abs(clientX - startXRef.current);

    if (deltaY <= 0) {
      if (pullDistanceRef.current > 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      return false;
    }

    // Cancel pull-to-refresh if horizontal swipe dominates (e.g., banner carousel or horizontal tabs)
    if (pullDistanceRef.current === 0 && deltaX > deltaY && deltaX > 8) {
      resetPull();
      return false;
    }

    if (deltaY > 6) {
      // Smooth elastic damping curve (Android Material feel)
      const damped = Math.min(MAX_PULL_DISTANCE, Math.round(Math.pow(deltaY - 6, 0.82) * 1.6));
      pullDistanceRef.current = damped;
      setPullDistance(damped);
      return true;
    }

    return false;
  };

  const handleEnd = () => {
    if (!pullingRef.current) return;
    const currentPull = pullDistanceRef.current;
    startYRef.current = null;
    startXRef.current = null;
    pullingRef.current = false;
    setIsPulling(false);

    if (currentPull >= TRIGGER_THRESHOLD && !isRefreshing) {
      void triggerRefresh();
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  };

  const progress = Math.min(1, pullDistance / TRIGGER_THRESHOLD);
  const isReady = pullDistance >= TRIGGER_THRESHOLD;
  const showIndicator = pullDistance > 6 || isRefreshing;

  return (
    <main
      ref={containerRef}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          handleStart(e.touches[0].clientY, e.touches[0].clientX, e.target, false);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 1) {
          handleMove(e.touches[0].clientY, e.touches[0].clientX);
        }
      }}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={(e) => {
        if (e.button === 0) {
          handleStart(e.clientY, e.clientX, e.target, true);
        }
      }}
      onMouseMove={(e) => {
        if (pullingRef.current) {
          handleMove(e.clientY, e.clientX);
        }
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      className={`relative overscroll-y-contain ${className}`}
    >
      {/* Android Material Pull-to-Refresh Floating Indicator */}
      <div
        aria-live="polite"
        className={`pointer-events-none sticky top-0 left-0 right-0 z-40 flex flex-col items-center justify-start transition-opacity duration-150 ${
          showIndicator ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ height: 0, overflow: 'visible' }}
      >
        <div
          className="flex flex-col items-center space-y-1.5 transition-transform duration-150 ease-out"
          style={{
            transform: `translateY(${isRefreshing ? 14 : Math.max(-44, pullDistance - 44)}px)`
          }}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xl shadow-black/70 border transition-colors ${
              isRefreshing
                ? 'bg-slate-900 border-amber-400/70 text-amber-400'
                : isReady
                ? 'bg-emerald-950 border-emerald-400 text-emerald-400 scale-105'
                : 'bg-slate-900 border-slate-700 text-amber-400'
            }`}
          >
            <RefreshCw
              className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
              style={
                !isRefreshing
                  ? { transform: `rotate(${Math.round(progress * 270)}deg)` }
                  : undefined
              }
            />
          </div>
          {(isRefreshing || pullDistance > 26) && (
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-md backdrop-blur-md ${
                isRefreshing
                  ? 'bg-slate-900/95 border-amber-500/40 text-amber-300'
                  : isReady
                  ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}
            >
              {isRefreshing
                ? 'Refreshing...'
                : isReady
                ? 'Release to refresh'
                : 'Pull down to refresh'}
            </span>
          )}
        </div>
      </div>

      {/* Content Wrapper with Subtle Elastic Pull Shift */}
      <div
        className={isPulling ? '' : 'transition-transform duration-200 ease-out'}
        style={{
          transform: pullDistance > 0 ? `translateY(${Math.round(pullDistance * 0.35)}px)` : undefined
        }}
      >
        {children}
      </div>
    </main>
  );
};
