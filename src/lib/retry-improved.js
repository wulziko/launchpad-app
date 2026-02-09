/**
 * Improved retry utility with better error messages
 */

/**
 * Retry fetch with exponential backoff and detailed error messages
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

      // Get error details from response body
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = `HTTP ${response.status}: ${errorData.error}`
            if (errorData.details) {
              errorMessage += ` - ${JSON.stringify(errorData.details)}`
            }
            if (errorData.required) {
              errorMessage += ` - Required fields: ${errorData.required.join(', ')}`
            }
            if (errorData.received) {
              errorMessage += ` - Received: ${JSON.stringify(errorData.received)}`
            }
          }
        }
      } catch (e) {
        // If we can't parse the error body, just use the status
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

export default {
  fetchWithRetry
}
