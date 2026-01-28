import { useState, useEffect } from 'react'
import { subscribeToAutomationUpdates, getAutomationStatus, triggerBannerGeneration } from '../lib/automation'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Download, 
  Image as ImageIcon,
  ExternalLink,
  Play,
  RefreshCw
} from 'lucide-react'

export default function AutomationProgress({ product, onStatusChange }) {
  const [status, setStatus] = useState(null)
  const [isTriggering, setIsTriggering] = useState(false)

  // Load initial status and subscribe to updates
  useEffect(() => {
    if (!product?.id) return

    // Get initial status
    getAutomationStatus(product.id).then(setStatus).catch(console.error)

    // Subscribe to real-time updates
    const unsubscribe = subscribeToAutomationUpdates(product.id, (update) => {
      setStatus(update)
      onStatusChange?.(update)
    })

    return unsubscribe
  }, [product?.id])

  const handleTrigger = async () => {
    setIsTriggering(true)
    try {
      await triggerBannerGeneration(product)
    } catch (error) {
      console.error('Failed to trigger automation:', error)
    } finally {
      setIsTriggering(false)
    }
  }

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Sparkles className="w-5 h-5 text-dark-400" />
    }
  }

  const getStatusColor = () => {
    switch (status?.status) {
      case 'processing':
        return 'border-primary-500/50 bg-primary-500/10'
      case 'completed':
        return 'border-green-500/50 bg-green-500/10'
      case 'error':
        return 'border-red-500/50 bg-red-500/10'
      default:
        return 'border-dark-600 bg-dark-800'
    }
  }

  return (
    <div className={`rounded-xl border p-6 ${getStatusColor()} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-white">Banner Generation</h3>
            <p className="text-sm text-dark-400">
              {status?.status === 'processing' 
                ? 'AI is creating your banners...'
                : status?.status === 'completed'
                ? 'Generation complete!'
                : status?.status === 'error'
                ? 'Something went wrong'
                : 'Ready to generate banners'}
            </p>
          </div>
        </div>

        {/* Trigger/Retry Button */}
        {(status?.status === 'idle' || status?.status === 'error' || !status?.status) && (
          <button
            onClick={handleTrigger}
            disabled={isTriggering}
            className="btn btn-primary"
          >
            {isTriggering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : status?.status === 'error' ? (
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
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {status?.status === 'processing' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-dark-300">{status.message}</span>
            <span className="text-primary-400 font-medium">{status.progress || 0}%</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${status.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {status?.status === 'error' && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
          <p className="text-sm text-red-400">{status.message}</p>
        </div>
      )}

      {/* Generated Banners */}
      {status?.banners && status.banners.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-dark-300 mb-3">
            Generated Banners ({status.banners.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {status.banners.map((banner, index) => (
              <div 
                key={banner.id || index}
                className="relative group rounded-lg overflow-hidden border border-dark-600 bg-dark-800"
              >
                <img 
                  src={banner.url} 
                  alt={banner.name || `Banner ${index + 1}`}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={banner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    title="View full size"
                  >
                    <ExternalLink className="w-4 h-4 text-white" />
                  </a>
                  <a
                    href={banner.url}
                    download={banner.name || `banner-${index + 1}.png`}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </a>
                </div>
                <div className="p-2">
                  <p className="text-xs text-dark-400 truncate">
                    {banner.name || `Banner ${index + 1}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Landing Page Link */}
      {status?.landingPageUrl && (
        <div className="mt-4 p-3 bg-dark-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-dark-300">Landing Page Generated</span>
            </div>
            <a
              href={status.landingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              View Page →
            </a>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!status?.banners || status.banners.length === 0) && status?.status !== 'processing' && (
        <div className="text-center py-8 text-dark-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No banners generated yet</p>
          <p className="text-sm mt-1">Click "Generate Banners" to start the AI automation</p>
        </div>
      )}
    </div>
  )
}
