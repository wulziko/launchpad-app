import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Download, RefreshCw, Copy, CheckCircle2, Edit2, Trash2 } from 'lucide-react'

export default function ReviewsPanel({ product, onRegenerate }) {
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const reviews = product?.metadata?.reviews || []
  
  const handleRegenerate = async () => {
    setGenerating(true)
    try {
      await onRegenerate()
    } finally {
      setGenerating(false)
    }
  }
  
  const handleCopy = (review) => {
    const text = `${review.rating} stars - ${review.title}\n${review.body}\n- ${review.author}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleExportCSV = () => {
    const csv = [
      ['Rating', 'Title', 'Body', 'Author', 'Verified', 'Date'],
      ...reviews.map(r => [r.rating, r.title, r.body, r.author, r.verified ? 'Yes' : 'No', r.date])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${product.name}-reviews.csv`
    a.click()
  }
  
  const handleExportJSON = () => {
    const json = JSON.stringify(reviews, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${product.name}-reviews.json`
    a.click()
  }
  
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length
  }))
  
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0
  
  // FIX #1: Always show header with prominent action button
  return (
    <div className="space-y-6">
      {/* Header with Action Button - ALWAYS VISIBLE */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Product Reviews</h3>
            <p className="text-sm text-dark-400">
              {reviews.length === 0 
                ? 'Generate AI-powered reviews to boost social proof' 
                : `${reviews.length} reviews generated`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {reviews.length > 0 && (
              <>
                <motion.button
                  onClick={handleExportCSV}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </motion.button>
                <motion.button
                  onClick={handleExportJSON}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-secondary btn-sm"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </motion.button>
              </>
            )}
            {/* FIX #1: Make generate button always prominent */}
            <motion.button
              onClick={handleRegenerate}
              disabled={generating}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(236, 72, 153, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  {reviews.length === 0 ? 'Generate Reviews' : 'Regenerate Reviews'}
                </>
              )}
            </motion.button>
          </div>
        </div>
        
        {/* Empty State Message (if no reviews) */}
        {reviews.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-dark-800 rounded-xl bg-dark-900/30">
            <Star className="w-10 h-10 mx-auto mb-3 text-dark-600" />
            <p className="text-dark-500 text-sm">No reviews yet. Click "Generate Reviews" to create them.</p>
          </div>
        )}
        
        {/* Rating Summary - Only show if we have reviews */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-dark-800/30 rounded-xl">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">{avgRating}</div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-5 h-5 ${i <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-600'}`} />
              ))}
            </div>
            <p className="text-xs text-dark-500">Average Rating</p>
          </div>
          
          <div className="md:col-span-2">
            {ratingCounts.map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm text-dark-400">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / reviews.length) * 100}%` }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="h-full bg-yellow-400"
                  />
                </div>
                <span className="text-sm text-dark-500 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
      
      {/* Reviews List - Only show if we have reviews */}
      {reviews.length > 0 && (
        <div className="space-y-4">
        <AnimatePresence>
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:border-dark-600 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-dark-600'}`} />
                    ))}
                  </div>
                  {review.verified && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <motion.button
                  onClick={() => handleCopy(review)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-dark-500 hover:text-white hover:bg-dark-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </motion.button>
              </div>
              
              <h4 className="text-base font-semibold text-white mb-2">{review.title}</h4>
              <p className="text-sm text-dark-300 mb-3 leading-relaxed">{review.body}</p>
              
              <div className="flex items-center justify-between text-xs text-dark-500">
                <span className="font-medium text-dark-400">{review.author}</span>
                <span>{review.date}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        </div>
      )}
    </div>
  )
}
