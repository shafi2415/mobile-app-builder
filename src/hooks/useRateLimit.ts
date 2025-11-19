import { useState, useCallback } from "react";

interface RateLimitState {
  count: number;
  timestamp: number;
}

// Rate limit configurations by action type
const RATE_LIMITS = {
  login: { maxAttempts: 5, duration: 15 * 60 * 1000 }, // 5 attempts per 15 min
  admin_login: { maxAttempts: 5, duration: 15 * 60 * 1000 }, // 5 attempts per 15 min
  register: { maxAttempts: 3, duration: 60 * 60 * 1000 }, // 3 attempts per hour
  complaint: { maxAttempts: 5, duration: 60 * 60 * 1000 }, // 5 per hour
  feedback: { maxAttempts: 3, duration: 60 * 60 * 1000 }, // 3 per hour
  chat: { maxAttempts: 60, duration: 60 * 1000 }, // 60 per minute
  file_upload: { maxAttempts: 10, duration: 60 * 60 * 1000 }, // 10 per hour
};

type RateLimitAction = keyof typeof RATE_LIMITS;

export const useRateLimit = (action: RateLimitAction) => {
  const [isLocked, setIsLocked] = useState(false);
  const config = RATE_LIMITS[action];

  const checkRateLimit = useCallback((): { allowed: boolean; remainingTime?: number } => {
    const storageKey = `rate_limit_${action}`;
    const stored = localStorage.getItem(storageKey);
    const state: RateLimitState = stored ? JSON.parse(stored) : { count: 0, timestamp: Date.now() };

    const now = Date.now();
    const timeSinceFirst = now - state.timestamp;

    // Reset if lockout period has passed
    if (timeSinceFirst > config.duration) {
      localStorage.removeItem(storageKey);
      setIsLocked(false);
      return { allowed: true };
    }

    // Check if locked
    if (state.count >= config.maxAttempts) {
      const remainingTime = Math.ceil((config.duration - timeSinceFirst) / 1000 / 60);
      setIsLocked(true);
      return { allowed: false, remainingTime };
    }

    setIsLocked(false);
    return { allowed: true };
  }, [action, config]);

  const incrementAttempts = useCallback(() => {
    const storageKey = `rate_limit_${action}`;
    const stored = localStorage.getItem(storageKey);
    const state: RateLimitState = stored ? JSON.parse(stored) : { count: 0, timestamp: Date.now() };

    state.count += 1;
    localStorage.setItem(storageKey, JSON.stringify(state));

    if (state.count >= config.maxAttempts) {
      setIsLocked(true);
    }
  }, [action, config.maxAttempts]);

  const resetAttempts = useCallback(() => {
    const storageKey = `rate_limit_${action}`;
    localStorage.removeItem(storageKey);
    setIsLocked(false);
  }, [action]);

  return { checkRateLimit, incrementAttempts, resetAttempts, isLocked };
};
