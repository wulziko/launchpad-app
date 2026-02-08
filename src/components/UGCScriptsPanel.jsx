import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, RefreshCw, Copy, CheckCircle2, ChevronDown, ChevronUp, Play, Download, ExternalLink } from 'lucide-react'

export default function UGCScriptsPanel({ product, onRegenerate }) {
  const [copied, setCopied] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [expandedScript, setExpandedScript] = useState(null)
  
  const scripts = product?.metadata?.ugc_scripts || []
  
  const handleRegenerate = async () => {
    setGenerating(true)
    try {
      await onRegenerate()
    } finally {
      setGenerating(false)
    }
  }
  
  const handleCopy = (script, section = 'full') => {
    const text = section === 'full' ? script.full_script : script[section]
    navigator.clipboard.writeText(text)
    setCopied(`${scripts.indexOf(script)}-${section}`)
    setTimeout(() => setCopied(null), 2000)
  }
  
  const angleColors = {
    skeptic: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'problem-solution': 'bg-green-500/10 text-green-400 border-green-500/20',
    'before-after': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    comparison: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    expert: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  }
  
  // FIX #1: Always show header with prominent action button
  return (
    <div className="space-y-6">
      {/* Header with Action Button - ALWAYS VISIBLE */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">UGC Video Scripts</h3>
            <p className="text-sm text-dark-400">
              {scripts.length === 0
                ? 'Generate UGC-style video scripts for social media ads'
                : `${scripts.length} script variations generated`}
            </p>
          </div>
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
                <Video className="w-4 h-4" />
                {scripts.length === 0 ? 'Generate Scripts' : 'Regenerate Scripts'}
              </>
            )}
          </motion.button>
        </div>
        
        {/* Empty State Message (if no scripts) */}
        {scripts.length === 0 && (
          <div className="mt-4 text-center py-8 border-2 border-dashed border-dark-800 rounded-xl bg-dark-900/30">
            <Video className="w-10 h-10 mx-auto mb-3 text-dark-600" />
            <p className="text-dark-500 text-sm">No UGC scripts yet. Click "Generate Scripts" to create them.</p>
          </div>
        )}
      </div>
      
      {/* Scripts Grid - Only show if we have scripts */}
      {scripts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {scripts.map((script, index) => {
            const isExpanded = expandedScript === index
            const angleType = script.angle || 'skeptic'
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-md border ${angleColors[angleType] || angleColors.skeptic}`}>
                        {angleType.replace('-', ' ').toUpperCase()}
                      </span>
                      {script.estimated_duration && (
                        <span className="text-xs text-dark-500">
                          ⏱️ {script.estimated_duration}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-semibold text-white">{script.title}</h4>
                  </div>
                  <motion.button
                    onClick={() => handleCopy(script, 'full')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-dark-500 hover:text-white hover:bg-dark-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copied === `${index}-full` ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
                
                {/* Video Player (if video available) */}
                {script.video_url && (
                  <div className="mb-4">
                    <div className="relative aspect-video bg-dark-900 rounded-lg overflow-hidden group/video">
                      <video
                        src={script.video_url}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/video:opacity-100 transition-opacity">
                        <motion.a
                          href={script.video_url}
                          download
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-dark-900/90 backdrop-blur-sm rounded-lg text-white hover:bg-dark-800"
                          title="Download video"
                        >
                          <Download className="w-4 h-4" />
                        </motion.a>
                        <motion.a
                          href={script.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-dark-900/90 backdrop-blur-sm rounded-lg text-white hover:bg-dark-800"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </motion.a>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-dark-500">
                      <span className={`px-2 py-1 rounded ${
                        script.video_status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        script.video_status === 'processing' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {script.video_status === 'completed' ? '✓ Video Ready' :
                         script.video_status === 'processing' ? '⏳ Processing...' :
                         '📹 Video Available'}
                      </span>
                      {script.created_at && (
                        <span>Generated {new Date(script.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Video Status (if processing) */}
                {!script.video_url && script.video_status === 'processing' && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-yellow-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Video is being generated... This may take 2-5 minutes</span>
                    </div>
                  </div>
                )}
                
                {/* Script Sections */}
                <div className="space-y-3">
                  {/* Hook */}
                  <div className="p-3 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-primary-400">🎣 HOOK (3-5s)</span>
                      <motion.button
                        onClick={() => handleCopy(script, 'hook')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 text-dark-500 hover:text-white rounded"
                      >
                        {copied === `${index}-hook` ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </motion.button>
                    </div>
                    <p className="text-sm text-dark-300 leading-relaxed">{script.hook}</p>
                  </div>
                  
                  {/* Collapsible Sections */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        {/* Problem */}
                        <div className="p-3 bg-dark-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-yellow-400">❗ PROBLEM (10-15s)</span>
                            <motion.button
                              onClick={() => handleCopy(script, 'problem')}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1 text-dark-500 hover:text-white rounded"
                            >
                              {copied === `${index}-problem` ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.button>
                          </div>
                          <p className="text-sm text-dark-300 leading-relaxed">{script.problem}</p>
                        </div>
                        
                        {/* Solution */}
                        <div className="p-3 bg-dark-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-green-400">✨ SOLUTION (15-20s)</span>
                            <motion.button
                              onClick={() => handleCopy(script, 'solution')}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1 text-dark-500 hover:text-white rounded"
                            >
                              {copied === `${index}-solution` ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.button>
                          </div>
                          <p className="text-sm text-dark-300 leading-relaxed">{script.solution}</p>
                        </div>
                        
                        {/* Benefits */}
                        <div className="p-3 bg-dark-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-purple-400">🎯 BENEFITS (10-15s)</span>
                            <motion.button
                              onClick={() => handleCopy(script, 'benefits')}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1 text-dark-500 hover:text-white rounded"
                            >
                              {copied === `${index}-benefits` ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.button>
                          </div>
                          <p className="text-sm text-dark-300 leading-relaxed">{script.benefits}</p>
                        </div>
                        
                        {/* CTA */}
                        <div className="p-3 bg-dark-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-pink-400">📣 CTA (5s)</span>
                            <motion.button
                              onClick={() => handleCopy(script, 'cta')}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1 text-dark-500 hover:text-white rounded"
                            >
                              {copied === `${index}-cta` ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.button>
                          </div>
                          <p className="text-sm text-dark-300 leading-relaxed">{script.cta}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Expand/Collapse Button */}
                <motion.button
                  onClick={() => setExpandedScript(isExpanded ? null : index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-3 py-2 text-sm text-dark-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show Full Script
                    </>
                  )}
                </motion.button>
              </motion.div>
            )
          })}
        </AnimatePresence>
        </div>
      )}
    </div>
  )
}
