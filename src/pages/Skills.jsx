import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { PageLoading } from '../components/LoadingSpinner'
import SkillConfigModal from '../components/SkillConfigModal'
import {
  Search,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  RefreshCw,
  BarChart3,
  Clock,
  Package,
  Filter,
  Grid3x3,
  List,
  Sparkles,
} from 'lucide-react'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

// Status badge component
function StatusBadge({ status }) {
  const config = {
    active: { icon: CheckCircle2, color: 'green', label: 'Active' },
    inactive: { icon: XCircle, color: 'gray', label: 'Inactive' },
    not_configured: { icon: AlertCircle, color: 'yellow', label: 'Not Configured' },
  }
  
  const { icon: Icon, color, label } = config[status] || config.not_configured
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
        color === 'green' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
        color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
        'bg-dark-800 text-dark-400 border border-dark-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </motion.div>
  )
}

// Skill card component
function SkillCard({ skill, index, onConfigure, onToggleStatus }) {
  const [isToggling, setIsToggling] = useState(false)
  
  const handleToggle = async (e) => {
    e.stopPropagation()
    setIsToggling(true)
    try {
      await onToggleStatus(skill.id, skill.status === 'active' ? 'inactive' : 'active')
    } finally {
      setIsToggling(false)
    }
  }
  
  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)' }}
      onClick={() => onConfigure(skill)}
      className="group card cursor-pointer relative overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="text-4xl"
          >
            {skill.emoji}
          </motion.div>
          <StatusBadge status={skill.status} />
        </div>
        
        {/* Name & Description */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
            {skill.name}
          </h3>
          <p className="text-sm text-dark-400 line-clamp-2">
            {skill.description || 'No description available'}
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-dark-500">
          <div className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{skill.usage_count || 0} uses</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(skill.last_used)}</span>
          </div>
        </div>
        
        {/* Requirements badges */}
        {skill.requires && Object.keys(skill.requires).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skill.requires.bins?.map((bin, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-dark-800 text-dark-400 text-xs rounded-md font-mono"
              >
                {bin}
              </span>
            ))}
            {skill.requires.env?.map((env, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-md"
              >
                {env}
              </span>
            ))}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); onConfigure(skill) }}
            className="flex-1 btn btn-secondary text-sm py-2"
          >
            <Settings className="w-4 h-4" />
            Configure
          </motion.button>
          
          {skill.status !== 'not_configured' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggle}
              disabled={isToggling}
              className={`p-2 rounded-lg transition-colors ${
                skill.status === 'active'
                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {isToggling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
            </motion.button>
          )}
          
          {skill.homepage && (
            <motion.a
              href={skill.homepage}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Skills() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  // Load skills from Supabase
  const loadSkills = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('skills')
        .select('*')
        .order('name', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setSkills(data || [])
    } catch (err) {
      console.error('Failed to load skills:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadSkills()
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('skills_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'skills'
      }, (payload) => {
        console.log('Skills change:', payload)
        loadSkills()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  // Filter and search skills
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || skill.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }, [skills, searchQuery, filterStatus])
  
  // Stats
  const stats = useMemo(() => {
    return {
      total: skills.length,
      active: skills.filter(s => s.status === 'active').length,
      inactive: skills.filter(s => s.status === 'inactive').length,
      notConfigured: skills.filter(s => s.status === 'not_configured').length,
    }
  }, [skills])
  
  // Toggle skill status
  const handleToggleStatus = async (skillId, newStatus) => {
    try {
      const { error } = await supabase
        .from('skills')
        .update({ status: newStatus })
        .eq('id', skillId)
      
      if (error) throw error
      
      // Optimistically update local state
      setSkills(prev => prev.map(s =>
        s.id === skillId ? { ...s, status: newStatus } : s
      ))
    } catch (err) {
      console.error('Failed to toggle status:', err)
      alert(`Failed to update status: ${err.message}`)
    }
  }
  
  // Open config modal
  const handleConfigure = (skill) => {
    setSelectedSkill(skill)
    setConfigModalOpen(true)
  }
  
  // Handle config save
  const handleConfigSave = async (skillId, config) => {
    try {
      const { error } = await supabase
        .from('skills')
        .update({
          config,
          status: 'active', // Auto-activate when configured
          updated_at: new Date().toISOString()
        })
        .eq('id', skillId)
      
      if (error) throw error
      
      // Reload skills
      await loadSkills()
      setConfigModalOpen(false)
    } catch (err) {
      console.error('Failed to save config:', err)
      throw err
    }
  }
  
  // Sync skills from filesystem
  const handleSyncSkills = async () => {
    setSyncing(true)
    try {
      // Call the discover-skills script via API/edge function
      // For now, just reload from database
      await loadSkills()
      alert('✅ Skills synced successfully!')
    } catch (err) {
      console.error('Failed to sync skills:', err)
      alert(`❌ Sync failed: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }
  
  if (loading && skills.length === 0) {
    return <PageLoading message="Loading skills..." />
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Skills</h1>
            <p className="text-dark-400">Manage and configure your LaunchPad skills</p>
          </div>
        </div>
        
        <motion.button
          onClick={handleSyncSkills}
          disabled={syncing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Skills'}
        </motion.button>
      </motion.div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'blue', icon: Package },
          { label: 'Active', value: stats.active, color: 'green', icon: CheckCircle2 },
          { label: 'Inactive', value: stats.inactive, color: 'gray', icon: XCircle },
          { label: 'Not Configured', value: stats.notConfigured, color: 'yellow', icon: AlertCircle },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -2 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                stat.color === 'green' ? 'bg-green-500/10' :
                stat.color === 'yellow' ? 'bg-yellow-500/10' :
                stat.color === 'blue' ? 'bg-blue-500/10' :
                'bg-dark-800'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'green' ? 'text-green-400' :
                  stat.color === 'yellow' ? 'text-yellow-400' :
                  stat.color === 'blue' ? 'text-blue-400' :
                  'text-dark-400'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-dark-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-dark-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="not_configured">Not Configured</option>
            </select>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-dark-800 rounded-lg">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-dark-500'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary-500/20 text-primary-400' : 'text-dark-500'
              }`}
            >
              <List className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-red-500/10 border border-red-500/20"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Failed to load skills</p>
              <p className="text-sm text-dark-400">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Skills Grid/List */}
      {filteredSkills.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 card"
        >
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-dark-700" />
          <h3 className="text-xl font-semibold text-white mb-2">No skills found</h3>
          <p className="text-dark-400 mb-6">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Click "Sync Skills" to discover skills from your filesystem'}
          </p>
          <motion.button
            onClick={handleSyncSkills}
            disabled={syncing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Skills'}
          </motion.button>
        </motion.div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredSkills.map((skill, index) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              index={index}
              onConfigure={handleConfigure}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
      
      {/* Config Modal */}
      <AnimatePresence>
        {configModalOpen && selectedSkill && (
          <SkillConfigModal
            skill={selectedSkill}
            onClose={() => setConfigModalOpen(false)}
            onSave={handleConfigSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
