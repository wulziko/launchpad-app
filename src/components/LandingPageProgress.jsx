import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLandingPageStatus, updateProductAutomationStatus } from '../lib/automation'
import { supabase } from '../lib/supabase'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Globe,
  Search,
  FileText,
  Image as ImageIcon,
  Upload,
  Zap,
  Clock,
  Square,
  RotateCcw,
} from 'lucide-react'

// Stage configuration for landing page generation
const STAGES = [
  { id: 'start', label: 'Starting generation', icon: Zap, progress: 0 },
  { id: 'research', label: 'AI Research', icon: Search, progress: 30 },
  { id: 'structure', label: 'Generating page structure', icon: FileText, progress: 40 },
  { id: 'images', label: 'Creating section images', icon: ImageIcon, progress: 70 },
  { id: 'html', label: 'Building HTML pages', icon: Globe, progress: 90 },
  { id: 'complete', label: 'Complete!', icon: CheckCircle2, progress: 100 }
]

function AnimatedNumber({ value, className }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValueRef = useRef(0)

  useEffect(() => {
    const startValue = prevValueRef.current
    const endValue = value
    const duration = 500
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * eased)
      
      setDisplayValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return <span className={className}>{displayValue}</span>
}

function StageItem({ stage, isActive, isComplete }) {
  const Icon = stage.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3 items-center"
    >
      <motion.div
        animate={{
          scale: isActive ? [1, 1.1, 1] : 1,
          backgroundColor: isComplete
            ? 'rgba(34, 197, 94, 0.2)'
            : isActive
              ? 'rgba(236, 72, 153, 0.2)'
              : 'rgba(51, 65, 85, 0.5)',
          borderColor: isComplete
            ? 'rgba(34, 197, 94, 0.5)'
            : isActive
              ? 'rgba(236, 72, 153, 0.5)'
              : 'rgba(71, 85, 105, 0.5)'
        }}
        transition={{
          scale: { repeat: isActive ? Infinity : 0, duration: 1.5 },
          backgroundColor: { duration: 0.3 }
        }}
        className="w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0"
      >
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </motion.div>
          ) : isActive ? (
            <motion.div
              key="active"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              <Loader2 className="w-4 h-4 text-primary-400" />
            </motion.div>
          ) : (
            <motion.div key="icon">
              <Icon className="w-4 h-4 text-dark-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex-1">
        <motion.p
          animate={{
            color: isComplete
              ? 'rgb(134, 239, 172)'
              : isActive
                ? 'rgb(255, 255, 255)'
                : 'rgb(100, 116, 139)'
          }}
          className="text-sm font-medium"
        >
          {stage.label}
        </motion.p>
      </div>
    </motion.div>
  )
}

export default function LandingPageProgress({ product }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isStopping, setIsStopping] = useState(false)

  const currentProgress = status?.progress || 0
  const currentStage = STAGES.findIndex(s => currentProgress < s.progress) - 1
  const activeStageIndex = Math.max(0, currentStage)
  
  const isProcessing = status?.status === 'processing'
  const isComplete = status?.status === 'completed' || status?.status === 'ready'
  const isError = status?.status === 'error'

  const handleStop = async () => {
    if (!product?.id) return
    setIsStopping(true)
    
    try {
      await updateProductAutomationStatus(product.id, {
        landing_page_status: 'idle',
        landing_page_progress: 0,
        landing_page_message: 'Generation stopped by user',
        landing_page_stopped_at: new Date().toISOString()
      })
      
      setStatus({
        status: 'idle',
        progress: 0,
        message: 'Generation stopped',
        pages: []
      })
    } catch (error) {
      console.error('Failed to stop landing page generation:', error)
      alert('Failed to stop generation')
    } finally {
      setIsStopping(false)
    }
  }

  const handleReset = async () => {
    if (!product?.id) return
    
    try {
      await updateProductAutomationStatus(product.id, {
        landing_page_status: 'idle',
        landing_page_progress: 0,
        landing_page_message: ''
      })
      
      setStatus({
        status: 'idle',
        progress: 0,
        message: '',
        pages: []
      })
    } catch (error) {
      console.error('Failed to reset:', error)
    }
  }

  useEffect(() => {
    if (!product?.id) return

    // Load initial status
    getLandingPageStatus(product.id).then(initialStatus => {
      setStatus(initialStatus)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load landing page status:', err)
      setLoading(false)
    })

    // Subscribe to real-time updates
    if (!supabase) return

    const channel = supabase
      .channel(`landing-page-${product.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${product.id}`
        },
        (payload) => {
          const metadata = payload.new.metadata || {}
          setStatus({
            status: metadata.landing_page_status || 'idle',
            progress: metadata.landing_page_progress || 0,
            message: metadata.landing_page_message || '',
            startedAt: metadata.landing_page_started_at,
            completedAt: metadata.landing_page_completed_at,
            pages: []
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [product?.id])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
          <span className="text-dark-400">Loading status...</span>
        </div>
      </div>
    )
  }

  if (!isProcessing && !isComplete && !isError) {
    return null // Don't show anything if not started
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card border ${
        isProcessing
          ? 'border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-purple-500/5'
          : isComplete
            ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5'
            : isError
              ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/5'
              : 'border-dark-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isProcessing ? 'bg-primary-500/20' : isComplete ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isProcessing ? (
              <Zap className="w-5 h-5 text-primary-400" />
            ) : isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-white">Landing Page Generation</h4>
            <p className="text-sm text-dark-400">
              {isProcessing
                ? 'Creating landing pages...'
                : isComplete
                  ? 'Generation complete!'
                  : 'Generation failed'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <motion.button
              onClick={handleStop}
              disabled={isStopping}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-sm"
            >
              {isStopping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Stop
                </>
              )}
            </motion.button>
          )}
          {(isComplete || isError) && (
            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-secondary text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </motion.button>
          )}
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-400">
              <AnimatedNumber value={currentProgress} />%
            </div>
            {isProcessing && (
              <p className="text-xs text-dark-500 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                ~2-3 min
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mb-5">
          <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 bg-[length:200%_100%]"
              initial={{ width: 0 }}
              animate={{
                width: `${currentProgress}%`,
                backgroundPosition: ['0% 0%', '100% 0%']
              }}
              transition={{
                width: { duration: 0.5, ease: 'easeOut' },
                backgroundPosition: { repeat: Infinity, duration: 2, ease: 'linear' }
              }}
            />
          </div>
          {status?.message && (
            <p className="text-sm text-dark-400 mt-2">{status.message}</p>
          )}
        </div>
      )}

      {/* Stages */}
      {isProcessing && (
        <div className="space-y-3">
          {STAGES.map((stage, index) => (
            <StageItem
              key={stage.id}
              stage={stage}
              isActive={index === activeStageIndex && isProcessing}
              isComplete={currentProgress >= stage.progress}
            />
          ))}
        </div>
      )}

      {/* Completion Message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">Landing pages generated successfully!</p>
            <p className="text-sm text-green-400/70 mt-1">
              {status?.pages?.length || 2} page{(status?.pages?.length || 2) === 1 ? '' : 's'} created
            </p>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Generation Failed</p>
              <p className="text-sm text-red-400/80 mt-1">{status?.message || 'An error occurred'}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
