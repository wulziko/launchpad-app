import { motion } from 'framer-motion'
import { Package, Zap, Image, FolderOpen, Plus, Sparkles } from 'lucide-react'

const icons = {
  products: Package,
  automations: Zap,
  assets: Image,
  default: FolderOpen,
}

const colors = {
  products: {
    bg: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    button: 'from-blue-500 to-blue-600',
  },
  automations: {
    bg: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    button: 'from-purple-500 to-purple-600',
  },
  assets: {
    bg: 'from-green-500/20 to-green-500/5',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    button: 'from-green-500 to-green-600',
  },
  default: {
    bg: 'from-primary-500/20 to-primary-500/5',
    border: 'border-primary-500/20',
    icon: 'text-primary-400',
    button: 'from-primary-500 to-primary-600',
  },
}

/**
 * Empty state component for when there's no data
 */
export default function EmptyState({ 
  type = 'default',
  title = 'No items yet',
  description = 'Get started by creating your first item.',
  action,
  actionLabel = 'Create',
}) {
  const Icon = icons[type] || icons.default
  const colorScheme = colors[type] || colors.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Animated Icon Container */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', bounce: 0.5 }}
        className={`relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${colorScheme.bg} border ${colorScheme.border} mb-6`}
      >
        {/* Floating particles */}
        <motion.div
          animate={{ 
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ repeat: Infinity, duration: 3, delay: 0 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-4 h-4 text-primary-400/50" />
        </motion.div>
        <motion.div
          animate={{ 
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
          className="absolute -bottom-1 -left-2"
        >
          <Sparkles className="w-3 h-3 text-primary-400/30" />
        </motion.div>
        
        {/* Main Icon */}
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          <Icon className={`w-10 h-10 ${colorScheme.icon}`} />
        </motion.div>
        
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${colorScheme.bg} blur-xl opacity-50`} />
      </motion.div>
      
      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-white mb-2"
      >
        {title}
      </motion.h3>
      
      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-dark-400 max-w-sm mb-8"
      >
        {description}
      </motion.p>
      
      {/* Action Button */}
      {action && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
          onClick={action}
          whileHover={{ 
            scale: 1.05,
            boxShadow: '0 20px 40px -15px rgba(236, 72, 153, 0.4)',
          }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary group"
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-5 h-5" />
          </motion.div>
          {actionLabel}
        </motion.button>
      )}
      
      {/* Decorative dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-1.5 mt-8"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              delay: i * 0.2,
            }}
            className="w-1.5 h-1.5 rounded-full bg-dark-600"
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
