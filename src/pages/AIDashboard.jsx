import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function AIDashboard() {
  const [activeTab, setActiveTab] = useState('status')
  const [data, setData] = useState({
    status: 'Loading...',
    tasks: 'Loading...',
    log: 'Loading...',
    notes: 'Loading...'
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchDashboard = async () => {
    try {
      const responses = await Promise.all([
        fetch('/dashboard/STATUS.md'),
        fetch('/dashboard/TASKS.md'),
        fetch('/dashboard/LOG.md'),
        fetch('/dashboard/NOTES.md')
      ])

      const [status, tasks, log, notes] = await Promise.all(
        responses.map(r => r.text())
      )

      setData({ status, tasks, log, notes })
      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const renderMarkdown = (text) => {
    // Simple markdown rendering
    return text
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-xl font-bold text-primary-400 mt-6 mb-3">{line.slice(4)}</h3>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-bold text-primary-300 mt-8 mb-4">{line.slice(3)}</h2>
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-3xl font-bold text-white mt-8 mb-4">{line.slice(2)}</h1>
        }
        
        // Horizontal rule
        if (line.trim() === '---') {
          return <hr key={i} className="my-6 border-dark-700" />
        }
        
        // Lists
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-6 text-dark-300">{line.slice(2)}</li>
        }
        
        // Bold/Italic (basic)
        let content = line
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>')
        content = content.replace(/`(.*?)`/g, '<code class="bg-dark-800 px-2 py-1 rounded text-primary-400">$1</code>')
        
        // Checkboxes
        content = content.replace(/\[x\]/gi, '✅')
        content = content.replace(/\[ \]/g, '⬜')
        
        // Emoji status indicators
        content = content.replace(/🟢/g, '<span class="text-green-400">🟢</span>')
        content = content.replace(/🟡/g, '<span class="text-yellow-400">🟡</span>')
        content = content.replace(/🔴/g, '<span class="text-red-400">🔴</span>')
        
        if (line.trim()) {
          return <p key={i} className="mb-2 text-dark-300" dangerouslySetInnerHTML={{ __html: content }} />
        }
        
        return <br key={i} />
      })
  }

  const tabs = [
    { id: 'status', label: '📊 Status', icon: '📊' },
    { id: 'tasks', label: '📋 Tasks', icon: '📋' },
    { id: 'log', label: '📜 Log', icon: '📜' },
    { id: 'notes', label: '📝 Notes', icon: '📝' }
  ]

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 px-8 py-12 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">🤖 David's Dashboard</h1>
          <p className="text-xl text-primary-100">Real-time transparency into what I'm doing</p>
          
          {/* Status Indicator */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">ACTIVE</span>
            </div>
            {lastUpdate && (
              <span className="text-primary-100 text-sm">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-8 mb-8">
        <div className="flex gap-2 bg-dark-900 p-2 rounded-lg border border-dark-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 pb-12">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-900 rounded-xl border border-dark-700 p-8"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              {renderMarkdown(data[activeTab])}
            </div>
          )}
        </motion.div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchDashboard}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-primary-500 to-purple-600 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform font-semibold flex items-center gap-2"
      >
        <span>🔄</span>
        <span>Refresh</span>
      </button>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-8 left-8 text-dark-500 text-sm">
        Auto-refreshing every 30 seconds
      </div>
    </div>
  )
}

export default AIDashboard
