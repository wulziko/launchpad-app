import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'
import { PageLoading } from '../components/LoadingSpinner'
import AutomationProgress from '../components/AutomationProgress'
import LandingPageProgress from '../components/LandingPageProgress'
import { triggerLandingPageGeneration } from '../lib/automation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Image,
  FileText,
  Zap,
  Clock,
  DollarSign,
  Users,
  Globe,
  Save,
  X,
  Download,
  Eye,
  ChevronDown,
  AlertCircle,
  Sparkles,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Package,
  Tag,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Maximize2,
  Plus,
  Loader2,
} from 'lucide-react'

// Status timeline configuration
const STATUS_TIMELINE = [
  { id: 'new', label: 'New', color: 'bg-blue-500' },
  { id: 'research', label: 'Research', color: 'bg-purple-500' },
  { id: 'banner_gen', label: 'Banner Gen', color: 'bg-yellow-500' },
  { id: 'landing_page', label: 'Landing Page', color: 'bg-orange-500' },
  { id: 'review', label: 'Review', color: 'bg-pink-500' },
  { id: 'live', label: 'Live', color: 'bg-green-500' },
]

// Tab content animation variants
const tabContentVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

// Status Timeline Component - checks actual completion, not just status position
function StatusTimeline({ currentStatus, onStatusChange, product, assets = [] }) {
  // Determine what's actually completed based on real data
  const banners = assets.filter(a => a.type === 'banner' && a.product_id === product?.id)
  const hasBanners = banners.length > 0
  const hasLandingPage = product?.metadata?.generated_landing_page_url || product?.metadata?.landing_page_completed
  
  // Build completion map based on actual data
  const completionMap = {
    'new': true, // Always complete if product exists
    'research': hasBanners, // Research is part of banner generation
    'banner_gen': hasBanners,
    'landing_page': hasLandingPage,
    'review': currentStatus === 'review' || currentStatus === 'ready' || currentStatus === 'live',
    'live': currentStatus === 'live'
  }
  
  // Find current stage (first incomplete or the current status)
  const currentIndex = STATUS_TIMELINE.findIndex(s => s.id === currentStatus)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Product Journey</h3>
          <p className="text-xs text-dark-500">Track your product's progress</p>
        </div>
      </div>
      
      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-5 left-5 right-5 h-1 bg-dark-800 rounded-full" />
        
        {/* Progress line filled - based on actual completions, not status position */}
        <motion.div
          className="absolute top-5 left-5 h-1 bg-gradient-to-r from-primary-500 to-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ 
            width: `${Math.max(0, (STATUS_TIMELINE.filter(s => completionMap[s.id]).length / STATUS_TIMELINE.length) * 100)}%` 
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ maxWidth: 'calc(100% - 40px)' }}
        />
        
        {/* Status nodes */}
        <div className="relative flex justify-between">
          {STATUS_TIMELINE.map((status, index) => {
            const isComplete = completionMap[status.id]
            const isCurrent = status.id === currentStatus
            const isFuture = !isComplete && !isCurrent
            
            return (
              <motion.button
                key={status.id}
                onClick={() => onStatusChange?.(status.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 group"
              >
                {/* Node */}
                <motion.div
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                    isComplete
                      ? 'bg-green-500/20 border-green-500'
                      : isCurrent
                        ? `${status.color.replace('bg-', 'bg-').replace('-500', '-500/20')} border-current`
                        : 'bg-dark-800 border-dark-700 group-hover:border-dark-500'
                  }`}
                  animate={isCurrent && !isComplete ? { scale: [1, 1.05, 1] } : {}}
                  transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
                  style={{ color: isCurrent && !isComplete ? status.color.replace('bg-', '').replace('-500', '') === 'blue' ? '#3b82f6' 
                    : status.color.replace('bg-', '').replace('-500', '') === 'purple' ? '#8b5cf6'
                    : status.color.replace('bg-', '').replace('-500', '') === 'yellow' ? '#eab308'
                    : status.color.replace('bg-', '').replace('-500', '') === 'orange' ? '#f97316'
                    : status.color.replace('bg-', '').replace('-500', '') === 'pink' ? '#ec4899'
                    : '#22c55e' : undefined }}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    >
                      <Zap className="w-5 h-5" style={{ color: 'inherit' }} />
                    </motion.div>
                  ) : (
                    <Circle className="w-5 h-5 text-dark-600" />
                  )}
                  
                  {/* Pulse effect for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2"
                      style={{ borderColor: 'inherit' }}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </motion.div>
                
                {/* Label */}
                <span className={`text-xs font-medium ${
                  isComplete ? 'text-green-400' : isCurrent ? 'text-white' : 'text-dark-500'
                }`}>
                  {status.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// Lightbox Component
function Lightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  const currentImage = images[currentIndex]
  
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </motion.button>
      
      {/* Counter */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/10 rounded-lg text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>
      
      {/* Navigation */}
      {images.length > 1 && (
        <>
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="absolute left-4 p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="absolute right-4 p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </>
      )}
      
      {/* Image */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25 }}
        className="max-w-[90vw] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage?.url}
          alt={currentImage?.name || 'Image'}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
      </motion.div>
      
      {/* Bottom info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <span className="text-white text-sm">{currentImage?.name || `Image ${currentIndex + 1}`}</span>
        <motion.a
          href={currentImage?.url}
          download={currentImage?.name || `image-${currentIndex + 1}.png`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </motion.a>
      </div>
    </motion.div>,
    document.body
  )
}

// Asset Gallery Component
function AssetGallery({ banners, productImage }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Combine product image with banners for gallery
  const allImages = [
    ...(productImage ? [{ url: productImage, name: 'Product Image', type: 'product' }] : []),
    ...(banners || []).map((b, i) => ({ url: b.file_url || b.url, name: b.name || `Banner ${i + 1}`, type: 'banner', id: b.id }))
  ]
  
  const openLightbox = (index) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length)
  }
  
  if (allImages.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-dark-800 rounded-xl">
        <Image className="w-12 h-12 mx-auto mb-3 text-dark-700" />
        <p className="text-dark-500">No images available</p>
      </div>
    )
  }
  
  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {allImages.map((image, index) => (
          <motion.div
            key={image.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03, y: -4 }}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-dark-800 border border-dark-700 cursor-pointer shadow-lg hover:shadow-xl transition-all"
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium truncate">{image.name}</p>
                <p className="text-white/60 text-xs capitalize">{image.type}</p>
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); openLightbox(index) }}
                  className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </motion.button>
                <motion.a
                  href={image.url}
                  download={image.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Download className="w-4 h-4 text-white" />
                </motion.a>
              </div>
            </div>
            
            {/* Type badge */}
            {image.type === 'product' && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                Main
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={allImages}
            currentIndex={currentIndex}
            onClose={() => setLightboxOpen(false)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// Download button with feedback
function DownloadButton({ url, name, children }) {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  
  const handleDownload = async () => {
    setDownloading(true)
    
    // Simulate download delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Trigger actual download
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setDownloading(false)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }
  
  return (
    <motion.button
      onClick={handleDownload}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={downloading}
      className={`relative overflow-hidden ${downloaded ? 'bg-green-500/20 text-green-400' : ''}`}
    >
      <AnimatePresence mode="wait">
        {downloaded ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Downloaded!
          </motion.span>
        ) : downloading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
            Downloading...
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, assets, STATUSES, updateProduct, updateProductStatus, deleteProduct, duplicateProduct, loading, error } = useData()
  const [isEditing, setIsEditing] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [saveIndicator, setSaveIndicator] = useState(false)
  const [isGeneratingLanding, setIsGeneratingLanding] = useState(false)

  const safeProducts = products || []
  const safeStatuses = STATUSES || []

  if (loading) {
    return <PageLoading message="Loading product..." />
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load product</h2>
        <p className="text-dark-400 mb-4">{error}</p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </motion.div>
    )
  }

  const product = safeProducts.find(p => p?.id === id)

  if (!product) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <Package className="w-16 h-16 text-dark-600 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Product not found</h2>
        <p className="text-dark-400 mb-6">This product may have been deleted.</p>
        <Link to="/products">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
          >
            Back to Products
          </motion.button>
        </Link>
      </motion.div>
    )
  }

  const productName = product.name || 'Untitled Product'
  const productDescription = product.description || ''
  const productPrice = product.price || 0
  const productMarket = product.market || '-'
  const productBanners = assets?.filter(a => a.type === 'banner' && a.product_id === product?.id) || []
  const productLandingPage = product.landingPage || { html: '', status: 'pending' }

  const statusInfo = safeStatuses.find(s => s?.id === product?.status) || {}

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct?.(id)
      navigate('/products')
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleDuplicate = async () => {
    try {
      const newProduct = await duplicateProduct?.(id)
      if (newProduct?.id) {
        navigate(`/products/${newProduct.id}`)
      }
    } catch (err) {
      console.error('Failed to duplicate:', err)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await updateProductStatus?.(id, newStatus)
      setStatusMenuOpen(false)
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }
  
  const handleNotesChange = async (notes) => {
    setSaveIndicator(true)
    try {
      await updateProduct?.(id, { notes })
    } catch (err) {
      console.error('Failed to save notes:', err)
    }
    setTimeout(() => setSaveIndicator(false), 1500)
  }

  const handleGenerateLanding = async () => {
    if (isGeneratingLanding) return
    
    setIsGeneratingLanding(true)
    try {
      await triggerLandingPageGeneration(product)
      // Success - the real-time subscription will handle status updates
    } catch (err) {
      console.error('Failed to trigger landing page generation:', err)
      alert(`Failed to start landing page generation: ${err.message}`)
    } finally {
      setIsGeneratingLanding(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Unknown'
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'banners', label: 'Banners', icon: Image, count: productBanners.length },
    { id: 'landing', label: 'Landing Page', icon: Globe },
    { id: 'activity', label: 'Activity', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <motion.button
            onClick={() => navigate('/products')}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 mb-2 flex-wrap"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{productName}</h1>
              
              {/* Status Dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`badge ${statusInfo?.color || 'bg-dark-700'} ${statusInfo?.textColor || 'text-dark-300'} cursor-pointer flex items-center gap-1`}
                >
                  {statusInfo?.label || product?.status || 'Unknown'}
                  <ChevronDown className="w-3 h-3" />
                </motion.button>
                <AnimatePresence>
                  {statusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute left-0 top-full mt-1 z-20 bg-dark-800 border border-dark-700 rounded-xl shadow-xl py-1 min-w-[180px] overflow-hidden"
                      >
                        {safeStatuses.map((status, index) => (
                          <motion.button
                            key={status?.id || Math.random()}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => handleStatusChange(status?.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-dark-700 transition-colors ${
                              product?.status === status?.id ? 'text-primary-400' : 'text-dark-300'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${status?.color || 'bg-dark-600'}`} />
                            {status?.label || 'Unknown'}
                          </motion.button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-dark-400"
            >
              {productDescription || 'No description'}
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <motion.button
            onClick={() => setIsEditing(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-secondary"
          >
            <Edit className="w-4 h-4" />
            Edit
          </motion.button>
          <motion.button
            onClick={handleDuplicate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-secondary"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </motion.button>
          <motion.button
            onClick={handleDelete}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-ghost text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </motion.div>
      
      {/* Hero Product Image */}
      {product?.product_image_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-dark-800 border border-dark-700"
        >
          <img
            src={product.product_image_url}
            alt={productName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-white font-bold text-xl">{productName}</p>
              <p className="text-dark-300 text-sm">{product.niche || 'No niche'}</p>
            </div>
            <motion.a
              href={product.product_image_url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </motion.a>
          </div>
        </motion.div>
      )}

      {/* Status Timeline */}
      <StatusTimeline
        currentStatus={product?.status}
        onStatusChange={handleStatusChange}
        product={product}
        assets={assets}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Price', value: `$${productPrice}`, color: 'green' },
          { icon: Globe, label: 'Market', value: productMarket, color: 'blue' },
          { icon: Users, label: 'Target', value: product?.targetAudience || 'Not specified', color: 'purple' },
          { icon: Image, label: 'Banners', value: productBanners.length, color: 'pink' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -2 }}
            className="card flex items-center gap-3"
          >
            <motion.div
              whileHover={{ rotate: 5 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                stat.color === 'green' ? 'bg-green-500/10' :
                stat.color === 'blue' ? 'bg-blue-500/10' :
                stat.color === 'purple' ? 'bg-purple-500/10' :
                'bg-primary-500/10'
              }`}
            >
              <stat.icon className={`w-5 h-5 ${
                stat.color === 'green' ? 'text-green-400' :
                stat.color === 'blue' ? 'text-blue-400' :
                stat.color === 'purple' ? 'text-purple-400' :
                'text-primary-400'
              }`} />
            </motion.div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-white truncate">{stat.value}</p>
              <p className="text-xs text-dark-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-b border-dark-800"
      >
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-dark-500 hover:text-dark-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 text-xs rounded-md ${
                  activeTab === tab.id ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-dark-500'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Product Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Product Image</h3>
                </div>
                {(product?.product_image_url || product?.metadata?.product_image_url) ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-dark-700 bg-dark-900">
                    <img 
                      src={product?.product_image_url || product?.metadata?.product_image_url} 
                      alt={product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl border-2 border-dashed border-dark-800 flex items-center justify-center bg-dark-900/50">
                    <div className="text-center">
                      <Image className="w-12 h-12 mx-auto mb-2 text-dark-700" />
                      <p className="text-dark-600">No product image</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Product Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Product Details</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Product Name</p>
                    <p className="text-white font-medium">{product?.name || 'Untitled'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Description</p>
                    <p className="text-white">{product?.description || '-'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-dark-500 mb-1">Niche</p>
                      <p className="text-white font-medium">{product?.niche || product?.metadata?.niche || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-500 mb-1">Target Audience</p>
                      <p className="text-white font-medium">{product?.targetAudience || product?.metadata?.targetAudience || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-dark-500 mb-1">Country</p>
                      <p className="text-white">{product?.country || product?.metadata?.country || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-500 mb-1">Language</p>
                      <p className="text-white">{product?.language || product?.metadata?.language || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-500 mb-1">Gender</p>
                      <p className="text-white">{product?.gender || product?.metadata?.gender || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-dark-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {((product?.tags || product?.metadata?.tags) || []).length > 0 ? (product?.tags || product?.metadata?.tags).map((tag, i) => (
                        <motion.span
                          key={tag || i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="badge bg-dark-800 text-dark-300 border border-dark-700"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </motion.span>
                      )) : (
                        <span className="text-dark-600">No tags</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Research Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Research Links</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Aliexpress', link: product?.aliexpress_link || product?.metadata?.aliexpress_link },
                    { label: 'Amazon', link: product?.amazon_link || product?.metadata?.amazon_link },
                    { label: 'Competitor #1', link: product?.competitor_link_1 || product?.metadata?.competitor_link_1 },
                    { label: 'Competitor #2', link: product?.competitor_link_2 || product?.metadata?.competitor_link_2 },
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-sm text-dark-500 mb-1">{item.label}</p>
                      {item.link ? (
                        <motion.a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ x: 2 }}
                          className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm truncate"
                        >
                          {item.link.substring(0, 45)}...
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </motion.a>
                      ) : (
                        <span className="text-dark-600 text-sm">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Notes with auto-save indicator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card lg:col-span-2"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Notes</h3>
                  </div>
                  <AnimatePresence>
                    {saveIndicator && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-sm text-green-400"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Saved
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <textarea
                  defaultValue={product?.notes || ''}
                  onChange={(e) => {
                    // Debounced auto-save
                    clearTimeout(window.notesTimeout)
                    window.notesTimeout = setTimeout(() => {
                      handleNotesChange(e.target.value)
                    }, 1000)
                  }}
                  className="input min-h-[150px] resize-none"
                  placeholder="Add notes about this product..."
                />
              </motion.div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card lg:col-span-2"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-dark-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Timeline</h3>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-dark-500">Created:</span>
                    <span className="text-white">{formatDate(product?.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-dark-500">Updated:</span>
                    <span className="text-white">{formatDate(product?.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-500">ID:</span>
                    <code className="text-dark-400 text-xs bg-dark-800 px-2 py-1 rounded">{product?.id}</code>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'banners' && (
            <div className="space-y-6">
              <AutomationProgress
                product={product}
                onStatusChange={(update) => console.log('Automation update:', update)}
                showBanners={false}
              />
              
              {/* Banner Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <Image className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Generated Banners</h3>
                      <p className="text-xs text-dark-500">All AI-generated banner creatives</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {productBanners.length > 0 && (
                      <>
                        <span className="text-sm text-dark-400">
                          {productBanners.length} {productBanners.length === 1 ? 'banner' : 'banners'}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            // Download all banners as zip
                            for (let i = 0; i < productBanners.length; i++) {
                              const banner = productBanners[i]
                              try {
                                const response = await fetch(banner.file_url || banner.url)
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = banner.name || `banner-${i + 1}.png`
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                                // Small delay between downloads
                                if (i < productBanners.length - 1) {
                                  await new Promise(resolve => setTimeout(resolve, 500))
                                }
                              } catch (error) {
                                console.error('Download failed for banner', i + 1, error)
                              }
                            }
                          }}
                          className="btn btn-secondary text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download All
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
                <AssetGallery
                  banners={productBanners}
                  productImage={null}
                />
              </motion.div>
            </div>
          )}

          {activeTab === 'landing' && (
            <div className="space-y-6">
              {/* Landing Page Progress */}
              <LandingPageProgress product={product} />

              {/* Generate Button Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Landing Pages</h3>
                      <p className="text-xs text-dark-500">Generate AI-powered landing pages</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleGenerateLanding}
                      disabled={isGeneratingLanding}
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(236, 72, 153, 0.4)' }}
                      whileTap={{ scale: 0.98 }}
                      className="btn btn-primary"
                    >
                      {isGeneratingLanding ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Generate Landing Pages
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Landing Pages List/Preview */}
                {productLandingPage.html ? (
                  <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                    <pre className="text-xs text-dark-400 overflow-x-auto font-mono">
                      {productLandingPage.html.substring(0, 500)}...
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-dark-800 rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-dark-700" />
                    <p className="text-dark-500">No landing pages generated yet</p>
                    <p className="text-sm text-dark-600 mt-1">Click "Generate Landing Pages" to create them</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Activity Log</h3>
              </div>
              <div className="space-y-4">
                {(() => {
                  const activities = []
                  const meta = product?.metadata || {}
                  
                  // Product lifecycle events
                  if (product?.created_at) {
                    activities.push({
                      color: 'bg-green-500',
                      icon: Plus,
                      label: 'Product created',
                      date: product.created_at,
                      description: `Created "${product.name}"`
                    })
                  }
                  
                  // Status changes based on current status
                  if (product?.status && product?.status !== 'new') {
                    activities.push({
                      color: 'bg-blue-500',
                      icon: Package,
                      label: `Status changed to "${product.status}"`,
                      date: product.updated_at,
                      description: 'Product status updated'
                    })
                  }
                  
                  // Banner generation started
                  if (meta.automation_started_at) {
                    activities.push({
                      color: 'bg-purple-500',
                      icon: Zap,
                      label: 'Banner generation started',
                      date: meta.automation_started_at,
                      description: 'AI automation initiated'
                    })
                  }
                  
                  // Banner generation completed
                  if (meta.automation_completed_at) {
                    activities.push({
                      color: 'bg-pink-500',
                      icon: Sparkles,
                      label: `Generated ${meta.automation_completed_banners || 10} banners`,
                      date: meta.automation_completed_at,
                      description: 'Banner generation completed successfully'
                    })
                  }
                  
                  // Banner generation stopped
                  if (meta.automation_stopped_at) {
                    activities.push({
                      color: 'bg-yellow-500',
                      icon: AlertCircle,
                      label: 'Banner generation stopped',
                      date: meta.automation_stopped_at,
                      description: `Stopped at ${meta.automation_progress || 0}%`
                    })
                  }
                  
                  // Landing page generation
                  if (meta.landing_page_started_at) {
                    activities.push({
                      color: 'bg-cyan-500',
                      icon: Globe,
                      label: 'Landing page generation started',
                      date: meta.landing_page_started_at,
                      description: 'Creating landing pages'
                    })
                  }
                  
                  if (meta.landing_page_completed_at) {
                    activities.push({
                      color: 'bg-teal-500',
                      icon: CheckCircle2,
                      label: 'Landing page generation completed',
                      date: meta.landing_page_completed_at,
                      description: 'Landing pages ready'
                    })
                  }
                  
                  // Product updated
                  if (product?.updated_at && product?.updated_at !== product?.created_at) {
                    activities.push({
                      color: 'bg-blue-400',
                      icon: FileText,
                      label: 'Product updated',
                      date: product.updated_at,
                      description: 'Product details modified'
                    })
                  }
                  
                  // Sort by date (newest first)
                  activities.sort((a, b) => new Date(b.date) - new Date(a.date))
                  
                  if (activities.length === 0) {
                    return (
                      <div className="text-center py-12 border-2 border-dashed border-dark-800 rounded-xl">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-dark-700" />
                        <p className="text-dark-500">No activity yet</p>
                      </div>
                    )
                  }
                  
                  return activities.map((item, i) => {
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4 pb-4 border-b border-dark-800 last:border-0 last:pb-0"
                      >
                        <div className="flex flex-col items-center">
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            className={`w-8 h-8 rounded-lg ${item.color} bg-opacity-20 border border-current flex items-center justify-center`}
                          >
                            <Icon className={`w-4 h-4 ${item.color.replace('bg-', 'text-')}`} />
                          </motion.div>
                          {i < activities.length - 1 && (
                            <div className="w-px flex-1 bg-dark-800 my-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-sm text-dark-500">{item.description}</p>
                          <p className="text-xs text-dark-600 mt-1">{formatDate(item.date)}</p>
                        </div>
                      </motion.div>
                    )
                  })
                })()}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <EditProductModal
            product={product}
            onClose={() => setIsEditing(false)}
            onSave={(updates) => {
              updateProduct?.(id, updates)
              setIsEditing(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EditProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    market: product?.market || 'US',
    niche: product?.niche || '',
    targetAudience: product?.targetAudience || '',
    price: String(product?.price || ''),
    tags: (product?.tags || []).join(', '),
    language: product?.language || 'English',
    country: product?.country || 'United States',
    gender: product?.gender || 'All',
    aliexpress_link: product?.aliexpress_link || '',
    amazon_link: product?.amazon_link || '',
    competitor_link_1: product?.competitor_link_1 || '',
    competitor_link_2: product?.competitor_link_2 || '',
    product_image_url: product?.product_image_url || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Product name is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim(),
        market: formData.market,
        niche: formData.niche.trim(),
        targetAudience: formData.targetAudience.trim(),
        price: parseFloat(formData.price) || 0,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        language: formData.language,
        country: formData.country,
        gender: formData.gender,
        aliexpress_link: formData.aliexpress_link.trim(),
        amazon_link: formData.amazon_link.trim(),
        competitor_link_1: formData.competitor_link_1.trim(),
        competitor_link_2: formData.competitor_link_2.trim(),
        product_image_url: formData.product_image_url.trim(),
      })
    } catch (err) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-dark-900/95 backdrop-blur-xl border border-dark-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"
            >
              <Edit className="w-5 h-5 text-blue-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">Edit Product</h2>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px] resize-none"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Niche</label>
              <select
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                className="input"
                disabled={submitting}
              >
                <option value="">Select niche...</option>
                <option value="Beauty & Skincare">Beauty & Skincare</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Fitness">Fitness</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Tech & Gadgets">Tech & Gadgets</option>
                <option value="Fashion">Fashion</option>
                <option value="Pet Supplies">Pet Supplies</option>
                <option value="Baby & Kids">Baby & Kids</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="input"
                disabled={submitting}
              >
                <option value="United States">🇺🇸 United States</option>
                <option value="Israel">🇮🇱 Israel</option>
                <option value="United Kingdom">🇬🇧 United Kingdom</option>
                <option value="Germany">🇩🇪 Germany</option>
                <option value="France">🇫🇷 France</option>
                <option value="Australia">🇦🇺 Australia</option>
                <option value="Canada">🇨🇦 Canada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="input"
                disabled={submitting}
              >
                <option value="English">English</option>
                <option value="Hebrew">Hebrew</option>
                <option value="Spanish">Spanish</option>
                <option value="German">German</option>
                <option value="French">French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Target Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input"
                disabled={submitting}
              >
                <option value="All">All</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Product Image URL</label>
            <input
              type="url"
              value={formData.product_image_url}
              onChange={(e) => setFormData({ ...formData, product_image_url: e.target.value })}
              className="input"
              placeholder="https://example.com/image.jpg"
              disabled={submitting}
            />
          </div>

          {/* Advanced Section */}
          <div className="border border-dark-700 rounded-xl overflow-hidden">
            <motion.button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
              className="w-full flex items-center justify-between p-4 text-left text-dark-400 hover:text-white transition-colors"
            >
              <span className="text-sm font-medium">Research Links & More</span>
              <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }}>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4 border-t border-dark-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Aliexpress Link</label>
                        <input
                          type="url"
                          value={formData.aliexpress_link}
                          onChange={(e) => setFormData({ ...formData, aliexpress_link: e.target.value })}
                          className="input"
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Amazon Link</label>
                        <input
                          type="url"
                          value={formData.amazon_link}
                          onChange={(e) => setFormData({ ...formData, amazon_link: e.target.value })}
                          className="input"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Competitor #1</label>
                        <input
                          type="url"
                          value={formData.competitor_link_1}
                          onChange={(e) => setFormData({ ...formData, competitor_link_1: e.target.value })}
                          className="input"
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Competitor #2</label>
                        <input
                          type="url"
                          value={formData.competitor_link_2}
                          onChange={(e) => setFormData({ ...formData, competitor_link_2: e.target.value })}
                          className="input"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Target Audience</label>
                      <input
                        type="text"
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        className="input"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="input"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -15px rgba(236, 72, 153, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary flex-1"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  )
}
