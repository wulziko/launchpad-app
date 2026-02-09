/**
 * Retry utility for failed API calls with exponential backoff
 * IMPROVED: Better error messages from response bodies
 */

/**
 * Retry a function with exponential backoff
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
 * Retry fetch with exponential backoff and DETAILED ERROR MESSAGES
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = null,
  } = retryOptions

  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      // If response is OK, return it
      if (response.ok) {
        return response
      }

      // IMPROVED: Get error details from response body
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = `${errorData.error}`
            if (errorData.required) {
              errorMessage += ` (required: ${errorData.required.join(', ')})`
            }
            if (errorData.received) {
              const missing = Object.entries(errorData.received)
                .filter(([k, v]) => !v)
                .map(([k]) => k)
              if (missing.length > 0) {
                errorMessage += ` - Missing: ${missing.join(', ')}`
              }
            }
            if (errorData.details) {
              errorMessage += ` - ${JSON.stringify(errorData.details)}`
            }
          }
        }
      } catch (e) {
        // If we can't parse the error body, just use the status
        console.error('[fetchWithRetry] Could not parse error response:', e)
      }

      const error = new Error(errorMessage)
      error.status = response.status
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw error
      }
      
      throw error
      
    } catch (error) {
      lastError = error
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Don't retry client errors (except 429)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
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

export function isRetryableError(error) {
  if (error.message.includes('NetworkError')) return true
  if (error.message.includes('Failed to fetch')) return true
  if (error.message.includes('ECONNREFUSED')) return true
  if (error.message.includes('ETIMEDOUT')) return true
  if (error.message.includes('HTTP 5')) return true
  if (error.message.includes('HTTP 429')) return true
  if (error.message.includes('Too Many Requests')) return true
  return false
}

export async function retryOnNetworkError(fn, options = {}) {
  return retryWithBackoff(fn, {
    ...options,
    shouldRetry: (error) => isRetryableError(error),
  })
}

export default {
  retryWithBackoff,
  fetchWithRetry,
  isRetryableError,
  retryOnNetworkError,
}
