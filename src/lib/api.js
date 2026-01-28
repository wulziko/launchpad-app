/**
 * Secure API client with rate limiting and error handling
 */

import { createRateLimiter } from './security';

// Rate limit: 100 requests per minute
const rateLimiter = createRateLimiter(100, 60000);

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Secure fetch wrapper
 */
async function secureFetch(url, options = {}) {
  // Check rate limit
  if (!rateLimiter()) {
    throw new ApiError('Rate limit exceeded. Please wait.', 429, 'RATE_LIMITED');
  }

  // Validate URL
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    throw new ApiError('Invalid URL', 400, 'INVALID_URL');
  }

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Timeout handling
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.code || 'HTTP_ERROR'
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeout);
    
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408, 'TIMEOUT');
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(error.message, 0, 'NETWORK_ERROR');
  }
}

/**
 * API client methods
 */
export const api = {
  async get(url, options = {}) {
    const response = await secureFetch(url, { ...options, method: 'GET' });
    return response.json();
  },

  async post(url, data, options = {}) {
    const response = await secureFetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async put(url, data, options = {}) {
    const response = await secureFetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async patch(url, data, options = {}) {
    const response = await secureFetch(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async delete(url, options = {}) {
    const response = await secureFetch(url, { ...options, method: 'DELETE' });
    return response.json();
  },
};

export { ApiError };
