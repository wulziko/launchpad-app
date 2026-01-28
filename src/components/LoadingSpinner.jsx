import { Rocket } from 'lucide-react'

/**
 * Loading spinner with optional message
 */
export function LoadingSpinner({ size = 'md', message = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary-500 ${sizeClasses[size]}`} />
      {message && <p className="text-dark-400 text-sm">{message}</p>}
    </div>
  )
}

/**
 * Full page loading state
 */
export function PageLoading({ message = 'Loading...' }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 animate-pulse">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <p className="text-dark-400">{message}</p>
      </div>
    </div>
  )
}

/**
 * Inline loading placeholder for content
 */
export function ContentLoading({ rows = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-dark-700 rounded" style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  )
}

/**
 * Card skeleton loader
 */
export function CardSkeleton() {
  return (
    <div className="bg-dark-800 rounded-lg p-4 animate-pulse">
      <div className="h-5 bg-dark-700 rounded w-3/4 mb-3" />
      <div className="h-4 bg-dark-700 rounded w-full mb-2" />
      <div className="h-4 bg-dark-700 rounded w-2/3" />
      <div className="flex justify-between mt-4">
        <div className="h-3 bg-dark-700 rounded w-20" />
        <div className="h-6 bg-dark-700 rounded w-24" />
      </div>
    </div>
  )
}

export default LoadingSpinner
