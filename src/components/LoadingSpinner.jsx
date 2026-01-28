import { motion } from 'framer-motion'
import { Rocket, Sparkles } from 'lucide-react'

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
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className={`rounded-full border-2 border-primary-500/30 border-t-primary-500 ${sizeClasses[size]}`}
      />
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-dark-400 text-sm"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

/**
 * Full page loading state with beautiful animation
 */
export function PageLoading({ message = 'Loading...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[50vh] flex items-center justify-center"
    >
      <div className="text-center">
        {/* Animated Logo */}
        <motion.div
          className="relative inline-flex items-center justify-center w-20 h-20 mb-6"
        >
          {/* Glow ring */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-2xl bg-primary-500/20 blur-xl"
          />
          
          {/* Main container */}
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-pink-600 flex items-center justify-center shadow-lg shadow-primary-500/30"
          >
            <Rocket className="w-8 h-8 text-white" />
          </motion.div>

          {/* Floating particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                x: [0, (i - 1) * 10, 0],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
              className="absolute"
              style={{
                top: `${20 + i * 10}%`,
                left: `${30 + i * 20}%`,
              }}
            >
              <Sparkles className="w-3 h-3 text-primary-400" />
            </motion.div>
          ))}
        </motion.div>

        {/* Loading text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-dark-400"
        >
          {message}
        </motion.p>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                repeat: Infinity,
                duration: 1,
                delay: i * 0.15,
              }}
              className="w-1.5 h-1.5 rounded-full bg-primary-500"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Inline loading placeholder for content
 */
export function ContentLoading({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="h-4 bg-dark-800 rounded skeleton"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  )
}

/**
 * Card skeleton loader
 */
export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-4"
    >
      <div className="h-5 bg-dark-700 rounded-lg w-3/4 mb-3 skeleton" />
      <div className="h-4 bg-dark-700 rounded w-full mb-2 skeleton" />
      <div className="h-4 bg-dark-700 rounded w-2/3 skeleton" />
      <div className="flex justify-between mt-4">
        <div className="h-3 bg-dark-700 rounded w-20 skeleton" />
        <div className="h-6 bg-dark-700 rounded-lg w-24 skeleton" />
      </div>
    </motion.div>
  )
}

/**
 * Button loading state
 */
export function ButtonLoading({ className = '' }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      className={`w-5 h-5 border-2 border-white/30 border-t-white rounded-full ${className}`}
    />
  )
}

export default LoadingSpinner
