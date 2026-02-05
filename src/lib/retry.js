/**
 * Retry utility for failed API calls with exponential backoff
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise} - Resolves with function result or rejects with last error
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = null,
  } = options

  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, maxRetries, delay, error)
      }

      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`, error.message)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Retry fetch with exponential backoff
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Retry options (see retryWithBackoff)
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options)
      
      // Throw on HTTP errors to trigger retry
      if (!response.ok) {
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      ...retryOptions
    }
  )
}

/**
 * Check if an error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} - True if error should be retried
 */
export function isRetryableError(error) {
  // Network errors
  if (error.message.includes('NetworkError')) return true
  if (error.message.includes('Failed to fetch')) return true
  if (error.message.includes('ECONNREFUSED')) return true
  if (error.message.includes('ETIMEDOUT')) return true
  
  // HTTP 5xx errors (server errors)
  if (error.message.includes('HTTP 5')) return true
  
  // Rate limiting
  if (error.message.includes('HTTP 429')) return true
  if (error.message.includes('Too Many Requests')) return true
  
  return false
}

/**
 * Retry wrapper that only retries on specific errors
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Resolves with function result or rejects
 */
export async function retryOnNetworkError(fn, options = {}) {
  return retryWithBackoff(fn, {
    ...options,
    // Only retry if error is retryable
    shouldRetry: (error) => isRetryableError(error),
  })
}

export default {
  retryWithBackoff,
  fetchWithRetry,
  isRetryableError,
  retryOnNetworkError,
}
