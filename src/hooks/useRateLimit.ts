import { useState, useCallback } from "react";

interface RateLimitState {
  count: number;
  timestamp: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const useRateLimit = (key: string) => {
  const [isLocked, setIsLocked] = useState(false);

  const checkRateLimit = useCallback((): { allowed: boolean; remainingTime?: number } => {
    const storageKey = `rate_limit_${key}`;
    const stored = localStorage.getItem(storageKey);
    const state: RateLimitState = stored ? JSON.parse(stored) : { count: 0, timestamp: Date.now() };

    const now = Date.now();
    const timeSinceFirst = now - state.timestamp;

    // Reset if lockout period has passed
    if (timeSinceFirst > LOCKOUT_DURATION) {
      localStorage.removeItem(storageKey);
      setIsLocked(false);
      return { allowed: true };
    }

    // Check if locked
    if (state.count >= MAX_ATTEMPTS) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceFirst) / 1000 / 60);
      setIsLocked(true);
      return { allowed: false, remainingTime };
    }

    setIsLocked(false);
    return { allowed: true };
  }, [key]);

  const incrementAttempts = useCallback(() => {
    const storageKey = `rate_limit_${key}`;
    const stored = localStorage.getItem(storageKey);
    const state: RateLimitState = stored ? JSON.parse(stored) : { count: 0, timestamp: Date.now() };

    state.count += 1;
    localStorage.setItem(storageKey, JSON.stringify(state));

    if (state.count >= MAX_ATTEMPTS) {
      setIsLocked(true);
    }
  }, [key]);

  const resetAttempts = useCallback(() => {
    const storageKey = `rate_limit_${key}`;
    localStorage.removeItem(storageKey);
    setIsLocked(false);
  }, [key]);

  return { checkRateLimit, incrementAttempts, resetAttempts, isLocked };
};
