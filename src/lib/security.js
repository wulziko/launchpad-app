/**
 * Security utilities for the Launchpad App
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize plain text (strips all HTML)
 */
export function sanitizeText(dirty) {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Validate URL is safe (no javascript:, data:, etc.)
 */
export function isValidUrl(string) {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Rate limiter for client-side actions
 */
export function createRateLimiter(maxRequests, windowMs) {
  const requests = [];
  
  return function isAllowed() {
    const now = Date.now();
    // Remove old requests outside the window
    while (requests.length > 0 && requests[0] < now - windowMs) {
      requests.shift();
    }
    
    if (requests.length >= maxRequests) {
      return false;
    }
    
    requests.push(now);
    return true;
  };
}

/**
 * Secure storage wrapper (adds prefix, handles errors)
 */
export const secureStorage = {
  prefix: 'launchpad_',
  
  set(key, value) {
    try {
      // Don't store sensitive data
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('token')) {
        console.warn('Attempted to store sensitive data in localStorage');
        return false;
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },
  
  get(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage error:', e);
      return null;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  clear() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Generate a random ID (for client-side use, not cryptographic)
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitive(str) {
  if (!str || str.length < 8) return '****';
  return str.slice(0, 4) + '****' + str.slice(-4);
}
