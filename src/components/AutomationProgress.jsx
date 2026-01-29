import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToAutomationUpdates, getAutomationStatus, triggerBannerGeneration, stopAutomation, resumeAutomation } from '../lib/automation'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Download, 
  Image as ImageIcon,
  ExternalLink,
  Play,
  RefreshCw,
  Rocket,
  Search,
  Upload,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Square,
  Pause,
  RotateCcw
} from 'lucide-react'

// Stage configuration
const STAGES = [
  { id: 'start', label: 'Starting automation', icon: Rocket, duration: '~5s' },
  { id: 'research', label: 'AI Research', icon: Search, duration: '~30s' },
  { id: 'creative', label: 'Generating concepts', icon: Sparkles, duration: '~20s' },
  { id: 'banners', label: 'Creating banners', icon: ImageIcon, duration: '~45s' },
  { id: 'upload', label: 'Uploading assets', icon: Upload, duration: '~10s' },
  { id: 'complete', label: 'Complete!', icon: CheckCircle2, duration: '0s' }
]

// Map automation message to stage
const getStageFromMessage = (message = '', progress = 0) => {
  const msg = message.toLowerCase()
  if (progress >= 100 || msg.includes('complete')) return 5
  if (msg.includes('upload') || progress >= 80) return 4
  if (msg.includes('banner') || msg.includes('creating') || progress >= 50) return 3
  if (msg.includes('concept') || msg.includes('generat') || progress >= 35) return 2
  if (msg.includes('research') || msg.includes('analyz') || progress >= 15) return 1
  return 0
}

// Confetti component
function Confetti({ active }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationRef = useRef(null)

  useEffect(() => {
    if (!active || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444']
    
    // Create particles
    particlesRef.current = Array.from({ length: 100 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 20,
      vy: -Math.random() * 15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.3,
      friction: 0.99,
      opacity: 1
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      let activeParticles = 0
      particlesRef.current.forEach(p => {
        if (p.opacity <= 0) return
        activeParticles++
        
        p.vy += p.gravity
        p.vx *= p.friction
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.opacity -= 0.008

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      })

      if (activeParticles > 0) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

// Animated number component
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

// Stage timeline item
function StageItem({ stage, index, currentStage, isComplete }) {
  const isActive = index === currentStage
  const isPast = index < currentStage
  const Icon = stage.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex gap-4"
    >
      {/* Connector line */}
      <div className="flex flex-col items-center">
        {/* Icon circle */}
        <motion.div
          initial={false}
          animate={{
            scale: isActive ? [1, 1.1, 1] : 1,
            backgroundColor: isPast || isComplete 
              ? 'rgba(34, 197, 94, 0.2)' 
              : isActive 
                ? 'rgba(236, 72, 153, 0.2)'
                : 'rgba(51, 65, 85, 0.5)',
            borderColor: isPast || isComplete
              ? 'rgba(34, 197, 94, 0.5)'
              : isActive
                ? 'rgba(236, 72, 153, 0.5)'
                : 'rgba(71, 85, 105, 0.5)'
          }}
          transition={{
            scale: { repeat: isActive ? Infinity : 0, duration: 1.5 },
            backgroundColor: { duration: 0.3 },
            borderColor: { duration: 0.3 }
          }}
          className="relative w-10 h-10 rounded-xl border-2 flex items-center justify-center z-10"
        >
          <AnimatePresence mode="wait">
            {isPast || isComplete ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </motion.div>
            ) : isActive ? (
              <motion.div
                key="active"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              >
                <Loader2 className="w-5 h-5 text-primary-400" />
              </motion.div>
            ) : (
              <motion.div key="icon">
                <Icon className="w-5 h-5 text-dark-500" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pulse ring for active */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-primary-400"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.div>

        {/* Connector line */}
        {index < STAGES.length - 1 && (
          <div className="relative w-0.5 h-8 bg-dark-700 my-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: isPast ? '100%' : '0%' }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-green-400 to-green-500"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <motion.p
            animate={{
              color: isPast || isComplete
                ? 'rgb(134, 239, 172)'
                : isActive
                  ? 'rgb(255, 255, 255)'
                  : 'rgb(100, 116, 139)'
            }}
            className="font-medium"
          >
            {stage.label}
          </motion.p>
          {!isPast && !isComplete && (
            <span className="text-xs text-dark-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {stage.duration}
            </span>
          )}
        </div>
        {isActive && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-dark-400 mt-1"
          >
            Processing...
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}

// Banner thumbnail with animation
function BannerThumbnail({ banner, index, totalBanners }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay: index * 0.15,
        type: 'spring',
        bounce: 0.4
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      className="relative group rounded-xl overflow-hidden border border-dark-600 bg-dark-800 shadow-lg"
    >
      <img 
        src={banner.url} 
        alt={banner.name || `Banner ${index + 1}`}
        className="w-full aspect-video object-cover"
      />
      <motion.div 
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between p-3"
      >
        <p className="text-xs text-white font-medium truncate flex-1">
          {banner.name || `Banner ${index + 1}`}
        </p>
        <div className="flex gap-1.5">
          <motion.a
            href={banner.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            title="View full size"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white" />
          </motion.a>
          <motion.a
            href={banner.url}
            download={banner.name || `banner-${index + 1}.png`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5 text-white" />
          </motion.a>
        </div>
      </motion.div>
      
      {/* New badge */}
      {index === totalBanners - 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
          className="absolute top-2 right-2 px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded-full"
        >
          New!
        </motion.div>
      )}
    </motion.div>
  )
}

export default function AutomationProgress({ product, onStatusChange }) {
  const [status, setStatus] = useState(null)
  const [isTriggering, setIsTriggering] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [logs, setLogs] = useState([])
  const prevStatusRef = useRef(null)

  const currentStage = getStageFromMessage(status?.message, status?.progress)
  const isProcessing = status?.status === 'processing'
  const isComplete = status?.status === 'completed'
  const isError = status?.status === 'error'
  const isStopped = status?.status === 'stopped'

  // Calculate estimated time remaining
  const getEstimatedTime = useCallback(() => {
    if (!isProcessing) return null
    const progress = status?.progress || 0
    if (progress === 0) return '~2 min'
    const remainingPercent = 100 - progress
    const estimatedSeconds = Math.round((remainingPercent / 100) * 120)
    if (estimatedSeconds < 60) return `~${estimatedSeconds}s`
    return `~${Math.round(estimatedSeconds / 60)} min`
  }, [isProcessing, status?.progress])

  // Load initial status and subscribe to updates
  useEffect(() => {
    if (!product?.id) return

    // Get initial status
    getAutomationStatus(product.id).then(initialStatus => {
      setStatus(initialStatus)
      if (initialStatus?.message) {
        setLogs(prev => [...prev, { time: new Date(), message: initialStatus.message }])
      }
    }).catch(console.error)

    // Subscribe to real-time updates
    const unsubscribe = subscribeToAutomationUpdates(product.id, (update) => {
      setStatus(update)
      onStatusChange?.(update)
      
      // Add to logs if message changed
      if (update.message && update.message !== prevStatusRef.current?.message) {
        setLogs(prev => [...prev, { time: new Date(), message: update.message }].slice(-20))
      }
      
      // Trigger confetti on completion
      if (update.status === 'completed' && prevStatusRef.current?.status !== 'completed') {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
      
      prevStatusRef.current = update
    })

    return unsubscribe
  }, [product?.id])

  const handleTrigger = async () => {
    setIsTriggering(true)
    setLogs([{ time: new Date(), message: 'Initiating automation...' }])
    
    // Optimistically update UI immediately for instant feedback
    setStatus(prev => ({
      ...prev,
      status: 'processing',
      progress: 0,
      message: 'Starting banner generation...',
      startedAt: new Date().toISOString()
    }))
    
    try {
      await triggerBannerGeneration(product)
      // Subscription will sync the real state from backend
    } catch (error) {
      console.error('Failed to trigger automation:', error)
      setLogs(prev => [...prev, { time: new Date(), message: `Error: ${error.message}` }])
      // Revert optimistic update on error
      setStatus(prev => ({
        ...prev,
        status: 'error',
        message: error.message
      }))
    } finally {
      setIsTriggering(false)
    }
  }

  const handleStop = async () => {
    setIsStopping(true)
    setLogs(prev => [...prev, { time: new Date(), message: 'Stopping automation...' }])
    
    // Optimistically update UI
    const currentProgress = status?.progress || 0
    setStatus(prev => ({
      ...prev,
      status: 'stopped',
      message: `Stopped at ${currentProgress}%`
    }))
    
    try {
      await stopAutomation(product.id)
      setLogs(prev => [...prev, { time: new Date(), message: 'Automation stopped by user' }])
    } catch (error) {
      console.error('Failed to stop automation:', error)
      setLogs(prev => [...prev, { time: new Date(), message: `Stop failed: ${error.message}` }])
    } finally {
      setIsStopping(false)
    }
  }

  const handleResume = async () => {
    setIsResuming(true)
    setLogs(prev => [...prev, { time: new Date(), message: 'Resuming automation...' }])
    
    // Optimistically update UI
    setStatus(prev => ({
      ...prev,
      status: 'processing',
      message: 'Resuming generation...'
    }))
    
    try {
      await resumeAutomation(product)
      setLogs(prev => [...prev, { time: new Date(), message: 'Automation resumed' }])
    } catch (error) {
      console.error('Failed to resume automation:', error)
      setLogs(prev => [...prev, { time: new Date(), message: `Resume failed: ${error.message}` }])
      // Revert on error
      setStatus(prev => ({
        ...prev,
        status: 'error',
        message: error.message
      }))
    } finally {
      setIsResuming(false)
    }
  }

  const getStatusColor = () => {
    if (isProcessing) return 'border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-purple-500/5'
    if (isComplete) return 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5'
    if (isError) return 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/5'
    if (isStopped) return 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5'
    return 'border-dark-700 bg-dark-900/50'
  }

  const getHeaderGradient = () => {
    if (isProcessing) return 'from-primary-400 to-purple-400'
    if (isComplete) return 'from-green-400 to-emerald-400'
    if (isError) return 'from-red-400 to-orange-400'
    if (isStopped) return 'from-amber-400 to-yellow-400'
    return 'from-dark-400 to-dark-500'
  }

  return (
    <motion.div
      layout
      className={`relative rounded-2xl border p-6 ${getStatusColor()} transition-all duration-500 overflow-hidden`}
    >
      {/* Confetti overlay */}
      <Confetti active={showConfetti} />

      {/* Background glow effect */}
      {isProcessing && (
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 0% 0%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 100%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 0%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Header */}
      <div className="relative flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div
            animate={isProcessing ? { rotate: 360 } : { rotate: 0 }}
            transition={isProcessing ? { repeat: Infinity, duration: 3, ease: 'linear' } : {}}
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isProcessing ? 'bg-primary-500/20' : isComplete ? 'bg-green-500/20' : isError ? 'bg-red-500/20' : 'bg-dark-800'
            }`}
          >
            {isProcessing ? (
              <Zap className="w-6 h-6 text-primary-400" />
            ) : isComplete ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : isError ? (
              <XCircle className="w-6 h-6 text-red-400" />
            ) : (
              <Sparkles className="w-6 h-6 text-dark-400" />
            )}
          </motion.div>
          <div>
            <h3 className={`font-bold text-lg bg-gradient-to-r ${getHeaderGradient()} bg-clip-text text-transparent`}>
              Banner Generation
            </h3>
            <p className="text-sm text-dark-400">
              {isProcessing 
                ? 'AI is creating your banners...'
                : isComplete
                ? `Generation complete! ${status?.banners?.length || 0} banners created`
                : isError
                ? 'Something went wrong'
                : isStopped
                ? `Stopped at ${status?.progress || 0}% - click Resume to continue`
                : 'Ready to generate banners'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Stop Button - shown during processing */}
          <AnimatePresence mode="wait">
            {isProcessing && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleStop}
                disabled={isStopping}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
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
          </AnimatePresence>

          {/* Resume Button - shown when stopped */}
          <AnimatePresence mode="wait">
            {isStopped && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleResume}
                disabled={isResuming}
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -15px rgba(34, 197, 94, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="btn bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
              >
                {isResuming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resuming...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Trigger/Retry Button */}
          <AnimatePresence mode="wait">
            {(!isProcessing && !isStopped && (status?.status === 'idle' || isError || !status?.status)) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleTrigger}
                disabled={isTriggering}
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -15px rgba(236, 72, 153, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary"
              >
                {isTriggering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : isError ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Generate Banners
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Restart Button - shown when stopped (secondary option) */}
          <AnimatePresence mode="wait">
            {isStopped && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleTrigger}
                disabled={isTriggering}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn bg-dark-700 text-dark-300 border border-dark-600 hover:bg-dark-600"
                title="Start over from the beginning"
              >
                {isTriggering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Processing State */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-dark-300 font-medium">{status?.message || 'Processing...'}</span>
                <div className="flex items-center gap-3">
                  {getEstimatedTime() && (
                    <span className="text-dark-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getEstimatedTime()}
                    </span>
                  )}
                  <span className="text-primary-400 font-bold">
                    <AnimatedNumber value={status?.progress || 0} />%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 bg-[length:200%_100%]"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${status?.progress || 0}%`,
                    backgroundPosition: ['0% 0%', '100% 0%']
                  }}
                  transition={{
                    width: { duration: 0.5, ease: 'easeOut' },
                    backgroundPosition: { repeat: Infinity, duration: 2, ease: 'linear' }
                  }}
                />
              </div>
            </div>

            {/* Stage Timeline */}
            <div className="mb-4">
              {STAGES.map((stage, index) => (
                <StageItem
                  key={stage.id}
                  stage={stage}
                  index={index}
                  currentStage={currentStage}
                  isComplete={isComplete}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed State with Stages */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">All stages completed successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stopped State */}
      <AnimatePresence>
        {isStopped && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4"
          >
            <div className="flex items-start gap-3">
              <Pause className="w-5 h-5 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-400 font-medium">Generation Paused</p>
                <p className="text-sm text-amber-400/80 mt-1">
                  Stopped at {status?.progress || 0}% • {status?.message || 'Click Resume to continue from where you left off'}
                </p>
                {/* Progress indicator for stopped state */}
                <div className="mt-3">
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500/50 rounded-full"
                      style={{ width: `${status?.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4"
          >
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Generation Failed</p>
                <p className="text-sm text-red-400/80 mt-1">{status?.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Banners */}
      <AnimatePresence>
        {status?.banners && status.banners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-400" />
                Generated Banners
                <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                  {status.banners.length}
                </span>
              </h4>
              {status.banners.length > 3 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  View all →
                </motion.button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {status.banners.map((banner, index) => (
                <BannerThumbnail
                  key={banner.id || index}
                  banner={banner}
                  index={index}
                  totalBanners={status.banners.length}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Landing Page Link */}
      <AnimatePresence>
        {status?.landingPageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-dark-800/50 border border-dark-700 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Landing Page Ready</p>
                  <p className="text-xs text-dark-500">Click to preview your generated page</p>
                </div>
              </div>
              <motion.a
                href={status.landingPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-secondary"
              >
                View Page
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Logs */}
      {logs.length > 0 && (
        <div className="mt-4">
          <motion.button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 text-xs text-dark-500 hover:text-dark-300 transition-colors"
          >
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Activity Log ({logs.length})
          </motion.button>
          <AnimatePresence>
            {showLogs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-3 bg-dark-900/80 border border-dark-800 rounded-lg max-h-32 overflow-y-auto"
              >
                <div className="space-y-1.5">
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex gap-2 text-xs"
                    >
                      <span className="text-dark-600 font-mono whitespace-nowrap">
                        {log.time.toLocaleTimeString()}
                      </span>
                      <span className="text-dark-400">{log.message}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      <AnimatePresence>
        {(!status?.banners || status.banners.length === 0) && !isProcessing && !isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-10"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-dark-700" />
            </motion.div>
            <p className="text-dark-500 font-medium">No banners generated yet</p>
            <p className="text-sm text-dark-600 mt-1">Click "Generate Banners" to start the AI automation</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
