import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  Users,
  DollarSign,
  Award,
  Loader2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  BarChart3,
  FileText,
  Zap,
  Copy,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

// Score indicator with animation
function ScoreIndicator({ score }) {
  const getScoreColor = (score) => {
    if (score >= 8) return { bg: 'bg-green-500', text: 'text-green-400', ring: 'ring-green-500/20' }
    if (score >= 6) return { bg: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/20' }
    return { bg: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/20' }
  }

  const colors = getScoreColor(score)
  const percentage = (score / 10) * 100

  return (
    <div className="relative">
      <svg className="w-32 h-32 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-dark-800"
        />
        {/* Progress circle */}
        <motion.circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={colors.text}
          initial={{ strokeDashoffset: 352 }}
          animate={{ strokeDashoffset: 352 - (352 * percentage) / 100 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: 352,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className={`text-4xl font-bold ${colors.text}`}
        >
          {score}
        </motion.span>
        <span className="text-xs text-dark-500">out of 10</span>
      </div>
    </div>
  )
}

// Recommendation badge
function RecommendationBadge({ recommendation }) {
  const config = {
    STRONG: { color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle2, label: 'Strong Buy' },
    MODERATE: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: TrendingUp, label: 'Moderate' },
    WEAK: { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Weak' },
  }

  const { color, icon: Icon, label } = config[recommendation] || config.MODERATE

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${color} font-semibold`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </motion.div>
  )
}

// Section card wrapper
function ResearchSection({ icon: Icon, title, children, iconColor = 'text-primary-400', iconBg = 'bg-primary-500/10', action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="text-dark-300 space-y-3">
        {children}
      </div>
    </motion.div>
  )
}

export default function ResearchPanel({ product, onTriggerResearch }) {
  const [isStarting, setIsStarting] = useState(false)
  const [liveResearch, setLiveResearch] = useState(product?.metadata?.research)
  const [copiedSection, setCopiedSection] = useState(null)
  
  // Use live research data if available, fallback to product data
  const research = liveResearch || product?.metadata?.research
  const hasResearch = research && research.report
  const isGenerating = research?.status === 'generating' || (research?.progress > 0 && research?.progress < 100)
  const progress = research?.progress || 0

  const handleStart = async () => {
    setIsStarting(true)
    try {
      await onTriggerResearch?.(product.id)
    } catch (err) {
      console.error('Failed to start research:', err)
      alert('Failed to start research: ' + err.message)
    } finally {
      setIsStarting(false)
    }
  }

  // Real-time polling for research progress
  useEffect(() => {
    if (!product?.id || !isGenerating) return

    console.log('[ResearchPanel] Starting real-time polling for product:', product.id)

    // Poll every 2 seconds while research is active
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('metadata')
          .eq('id', product.id)
          .single()

        if (error) throw error

        if (data?.metadata?.research) {
          const updatedResearch = data.metadata.research
          console.log('[ResearchPanel] Progress update:', updatedResearch.progress, updatedResearch.status)
          setLiveResearch(updatedResearch)

          // Stop polling if complete
          if (updatedResearch.progress >= 100 || updatedResearch.status === 'completed') {
            console.log('[ResearchPanel] Research complete, stopping poll')
            clearInterval(pollInterval)
          }
        }
      } catch (err) {
        console.error('[ResearchPanel] Failed to poll research status:', err)
      }
    }, 2000)

    return () => {
      console.log('[ResearchPanel] Cleaning up poll interval')
      clearInterval(pollInterval)
    }
  }, [product?.id, isGenerating])

  // Update local state when product prop changes
  useEffect(() => {
    if (product?.metadata?.research) {
      setLiveResearch(product.metadata.research)
    }
  }, [product?.metadata?.research])

  // Copy text to clipboard with feedback
  const copyToClipboard = async (text, sectionName) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(sectionName)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  // No research yet
  if (!hasResearch && !isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center py-16"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">AI Product Research</h3>
        <p className="text-dark-400 mb-6 max-w-md mx-auto">
          Get comprehensive market analysis, selling angles, creative recommendations, and a winning product score
        </p>
        <motion.button
          onClick={handleStart}
          disabled={isStarting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary btn-lg"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Starting Research...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Start AI Research
            </>
          )}
        </motion.button>
      </motion.div>
    )
  }

  // Research in progress
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-purple-400" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-white">Analyzing Product...</h3>
                <p className="text-sm text-dark-500">{research?.status || 'Initializing'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-400">{progress}%</div>
              <div className="text-xs text-dark-500">Complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 bg-dark-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    )
  }

  // Research complete - show results
  return (
    <div className="space-y-6">
      {/* Header with score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreIndicator score={research.score || 5} />
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Winning Product Score</h2>
            <p className="text-dark-400 mb-4">AI-powered analysis of market potential</p>
            <RecommendationBadge recommendation={research.recommendation} />
          </div>
        </div>
      </motion.div>

      {/* Market Analysis */}
      {research.marketAnalysis && (
        <ResearchSection
          icon={BarChart3}
          title="Market Analysis"
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        >
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
            {research.marketAnalysis}
          </ReactMarkdown>
        </ResearchSection>
      )}

      {/* Competitive Landscape */}
      {research.competitiveLandscape && (
        <ResearchSection
          icon={Target}
          title="Competitive Landscape"
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
        >
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
            {research.competitiveLandscape}
          </ReactMarkdown>
        </ResearchSection>
      )}

      {/* Selling Angles */}
      {research.sellingAngles && (
        <ResearchSection
          icon={TrendingUp}
          title="Selling Angles"
          iconColor="text-green-400"
          iconBg="bg-green-500/10"
          action={
            <motion.button
              onClick={() => copyToClipboard(research.sellingAngles, 'sellingAngles')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white rounded-lg transition-colors"
            >
              {copiedSection === 'sellingAngles' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All
                </>
              )}
            </motion.button>
          }
        >
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
            {research.sellingAngles}
          </ReactMarkdown>
        </ResearchSection>
      )}

      {/* Creative Recommendations */}
      {research.creativeRecommendations && (
        <ResearchSection
          icon={Lightbulb}
          title="Creative Recommendations"
          iconColor="text-yellow-400"
          iconBg="bg-yellow-500/10"
          action={
            <motion.button
              onClick={() => copyToClipboard(research.creativeRecommendations, 'creativeRecommendations')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white rounded-lg transition-colors"
            >
              {copiedSection === 'creativeRecommendations' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All
                </>
              )}
            </motion.button>
          }
        >
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
            {research.creativeRecommendations}
          </ReactMarkdown>
        </ResearchSection>
      )}

      {/* Pain Points */}
      {research.painPoints && (
        <ResearchSection
          icon={Users}
          title="Customer Pain Points"
          iconColor="text-pink-400"
          iconBg="bg-pink-500/10"
          action={
            <motion.button
              onClick={() => copyToClipboard(research.painPoints, 'painPoints')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white rounded-lg transition-colors"
            >
              {copiedSection === 'painPoints' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All
                </>
              )}
            </motion.button>
          }
        >
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
            {research.painPoints}
          </ReactMarkdown>
        </ResearchSection>
      )}

      {/* Red Flags */}
      {research.redFlags && (
        <ResearchSection
          icon={AlertTriangle}
          title="Red Flags & Concerns"
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
        >
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
            {research.redFlags}
          </ReactMarkdown>
        </ResearchSection>
      )}

      {/* Full Report */}
      {research.report && (
        <ResearchSection
          icon={FileText}
          title="Full Research Report"
          iconColor="text-gray-400"
          iconBg="bg-gray-500/10"
        >
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
            {research.report}
          </ReactMarkdown>
        </ResearchSection>
      )}
    </div>
  )
}
