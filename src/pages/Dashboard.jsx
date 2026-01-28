import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { PageLoading } from '../components/LoadingSpinner'
import { useEffect, useState, useRef } from 'react'
import {
  Package,
  TrendingUp,
  Zap,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Activity,
} from 'lucide-react'

// Animated counter hook
function useAnimatedCounter(target, duration = 1000) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (target === countRef.current) return
    
    const startValue = countRef.current
    const endValue = target
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      
      // Easing function (ease-out-expo)
      const eased = 1 - Math.pow(2, -10 * progress)
      const current = Math.floor(startValue + (endValue - startValue) * eased)
      
      setCount(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        countRef.current = endValue
        startTimeRef.current = null
      }
    }
    
    requestAnimationFrame(animate)
  }, [target, duration])

  return count
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  const animatedValue = useAnimatedCounter(value || 0, 1200)
  
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 to-blue-500/5',
      border: 'border-blue-500/20',
      icon: 'bg-blue-500/20 text-blue-400',
      glow: 'shadow-blue-500/10',
    },
    yellow: {
      bg: 'from-yellow-500/20 to-yellow-500/5',
      border: 'border-yellow-500/20',
      icon: 'bg-yellow-500/20 text-yellow-400',
      glow: 'shadow-yellow-500/10',
    },
    green: {
      bg: 'from-green-500/20 to-green-500/5',
      border: 'border-green-500/20',
      icon: 'bg-green-500/20 text-green-400',
      glow: 'shadow-green-500/10',
    },
    pink: {
      bg: 'from-primary-500/20 to-primary-500/5',
      border: 'border-primary-500/20',
      icon: 'bg-primary-500/20 text-primary-400',
      glow: 'shadow-primary-500/10',
    },
  }
  
  const colors = colorClasses[color] || colorClasses.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-2xl p-5 shadow-lg ${colors.glow}`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.2, type: 'spring', bounce: 0.5 }}
          className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
        <div>
          <motion.p
            key={animatedValue}
            className="text-3xl font-bold text-white tabular-nums"
          >
            {animatedValue}
          </motion.p>
          <p className="text-sm text-dark-400">{label}</p>
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
    </motion.div>
  )
}

// Product Row Component
function ProductRow({ product, statusInfo, index }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group border-b border-dark-800/50 last:border-0"
    >
      <td className="py-4">
        <Link 
          to={`/products/${product.id}`} 
          className="flex items-center gap-3 group-hover:text-primary-400 transition-colors"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-lg shadow-sm"
          >
            📦
          </motion.div>
          <div>
            <p className="font-medium text-white group-hover:text-primary-400 transition-colors">
              {product.name || 'Untitled'}
            </p>
            <p className="text-xs text-dark-500">{product.niche || '-'}</p>
          </div>
        </Link>
      </td>
      <td className="py-4 text-dark-400">{product.market || '-'}</td>
      <td className="py-4">
        <motion.span
          whileHover={{ scale: 1.05 }}
          className={`badge ${statusInfo?.color || 'bg-dark-700'} ${statusInfo?.textColor || 'text-dark-300'}`}
        >
          {statusInfo?.label || product.status || 'Unknown'}
        </motion.span>
      </td>
      <td className="py-4 text-sm text-dark-500">
        {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }) : '-'}
      </td>
    </motion.tr>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { products, automations, getStats, STATUSES, loading, error } = useData()
  
  const stats = getStats?.() || { total: 0, inProgress: 0, ready: 0, live: 0 }
  const safeProducts = products || []
  const safeAutomations = automations || []
  const safeStatuses = STATUSES || []

  const recentProducts = [...safeProducts]
    .filter(p => p && p.updatedAt)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 5)

  const inProgressProducts = safeProducts.filter(p => 
    p && ['banner_gen', 'landing_page', 'review'].includes(p.status)
  )

  const getStatusInfo = (statusId) => safeStatuses.find(s => s?.id === statusId) || {}

  const formatDate = (date) => {
    if (!date) return '-'
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '-'
    }
  }

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return <PageLoading message="Loading dashboard..." />
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load dashboard</h2>
        <p className="text-dark-400 mb-4">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Try Again
        </motion.button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-1"
          >
            <Sparkles className="w-5 h-5 text-primary-400" />
            <span className="text-sm text-primary-400 font-medium">{getGreeting()}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-bold text-white"
          >
            {user?.name || 'there'} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-dark-400 mt-1"
          >
            Here's what's happening with your products today.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -15px rgba(236, 72, 153, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              New Product
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.total}
          color="blue"
          delay={0}
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={stats.inProgress}
          color="yellow"
          delay={0.1}
        />
        <StatCard
          icon={CheckCircle2}
          label="Ready to Launch"
          value={stats.ready}
          color="green"
          delay={0.2}
        />
        <StatCard
          icon={TrendingUp}
          label="Live Products"
          value={stats.live}
          color="pink"
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* In Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">In Progress</h2>
                <p className="text-xs text-dark-500">Products being processed</p>
              </div>
            </div>
            <Link to="/products">
              <motion.span
                whileHover={{ x: 5 }}
                className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
              >
                View all <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </div>

          <AnimatePresence mode="popLayout">
            {inProgressProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 text-dark-500"
              >
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No products in progress</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {inProgressProducts.slice(0, 5).map((product, index) => {
                  if (!product) return null
                  const statusInfo = getStatusInfo(product.status)
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/products/${product.id}`}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-800/50 transition-all group"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-lg"
                        >
                          📦
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                            {product.name || 'Untitled'}
                          </p>
                          <p className="text-sm text-dark-500">{product.market || '-'} • {product.niche || '-'}</p>
                        </div>
                        <span className={`badge ${statusInfo?.color || 'bg-dark-700'} ${statusInfo?.textColor || 'text-dark-300'}`}>
                          {statusInfo?.label || product.status || 'Unknown'}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-dark-600 group-hover:text-primary-400 transition-colors" />
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Automations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Automations</h2>
                <p className="text-xs text-dark-500">Active workflows</p>
              </div>
            </div>
            <Link to="/automations">
              <motion.span
                whileHover={{ x: 5 }}
                className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
              >
                Manage <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </div>

          <AnimatePresence mode="popLayout">
            {safeAutomations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 text-dark-500"
              >
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-4">No automations configured</p>
                <Link to="/automations">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-secondary"
                  >
                    Add Automation
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {safeAutomations.slice(0, 4).map((automation, index) => {
                  if (!automation) return null
                  const isActive = automation.is_active || automation.status === 'active'
                  return (
                    <motion.div
                      key={automation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/30 hover:bg-dark-800/50 transition-colors"
                    >
                      <motion.div
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-green-500/10' : 'bg-dark-700'
                        }`}
                      >
                        <Zap className={`w-5 h-5 ${
                          isActive ? 'text-green-400' : 'text-dark-500'
                        }`} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{automation.name || 'Unnamed'}</p>
                        <p className="text-sm text-dark-500">
                          {automation.run_count || automation.runsToday || 0} runs • 
                          Last: {formatDate(automation.last_run_at || automation.lastRun)}
                        </p>
                      </div>
                      <motion.div
                        animate={isActive ? { scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`w-2.5 h-2.5 rounded-full ${
                          isActive ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-dark-600'
                        }`}
                      />
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Products</h2>
              <p className="text-xs text-dark-500">Latest activity</p>
            </div>
          </div>
          <Link to="/products">
            <motion.span
              whileHover={{ x: 5 }}
              className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
            >
              View all <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </div>

        <AnimatePresence mode="popLayout">
          {recentProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 text-dark-500"
            >
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="mb-4">No products yet</p>
              <Link to="/products">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-primary"
                >
                  Add Your First Product
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-dark-500 border-b border-dark-800">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Market</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((product, index) => {
                    if (!product) return null
                    const statusInfo = getStatusInfo(product.status)
                    return (
                      <ProductRow
                        key={product.id}
                        product={product}
                        statusInfo={statusInfo}
                        index={index}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
