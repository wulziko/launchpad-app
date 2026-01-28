import { useState, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, Info, X, Sparkles } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = Date.now()
    setToasts(prev => [...prev, { ...toast, id }])
    
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 5000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const toast = {
    success: (message, options = {}) => addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => addToast({ type: 'info', message, ...options }),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] space-y-3 pointer-events-none">
          <AnimatePresence mode="popLayout">
            {toasts.map(t => (
              <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastItem({ toast, onDismiss }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const styles = {
    success: {
      border: 'border-green-500/30',
      bg: 'bg-green-500/10',
      icon: 'text-green-400',
      glow: 'shadow-green-500/10',
    },
    error: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      icon: 'text-red-400',
      glow: 'shadow-red-500/10',
    },
    warning: {
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/10',
      icon: 'text-yellow-400',
      glow: 'shadow-yellow-500/10',
    },
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      icon: 'text-blue-400',
      glow: 'shadow-blue-500/10',
    },
  }

  const style = styles[toast.type] || styles.info

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`
        pointer-events-auto
        flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl
        ${style.border} ${style.bg}
        min-w-[320px] max-w-[420px] 
        shadow-xl ${style.glow}
      `}
    >
      {/* Icon with animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
        className={style.icon}
      >
        {icons[toast.type]}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-semibold text-white text-sm"
          >
            {toast.title}
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="text-dark-200 text-sm leading-relaxed"
        >
          {toast.message}
        </motion.p>
      </div>

      {/* Dismiss button */}
      <motion.button
        onClick={onDismiss}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800/50 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </motion.button>

      {/* Success celebration particles */}
      {toast.type === 'success' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1 }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="w-4 h-4 text-green-400" />
        </motion.div>
      )}
    </motion.div>
  )
}

export default { ToastProvider, useToast }
