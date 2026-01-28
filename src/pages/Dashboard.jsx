import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import {
  Package,
  TrendingUp,
  Zap,
  Clock,
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { products, automations, getStats, STATUSES } = useData()
  const stats = getStats()

  // Get recent products
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)

  // Get in-progress products
  const inProgressProducts = products.filter(p => 
    ['banner_generation', 'landing_page', 'review'].includes(p.status)
  )

  const getStatusInfo = (statusId) => STATUSES.find(s => s.id === statusId)

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-dark-400 mt-1">
            Here's what's happening with your products today.
          </p>
        </div>
        <Link to="/products" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          New Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-dark-400">Total Products</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
              <p className="text-sm text-dark-400">In Progress</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.ready}</p>
              <p className="text-sm text-dark-400">Ready to Launch</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.live}</p>
              <p className="text-sm text-dark-400">Live Products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* In Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">In Progress</h2>
            <Link to="/products" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {inProgressProducts.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products in progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressProducts.map((product) => {
                const statusInfo = getStatusInfo(product.status)
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-dark-800 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-lg">
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                        {product.name}
                      </p>
                      <p className="text-sm text-dark-400">{product.market} • {product.niche}</p>
                    </div>
                    <span className={`badge ${statusInfo?.color} ${statusInfo?.textColor}`}>
                      {statusInfo?.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Automations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Automations</h2>
            <Link to="/automations" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Manage <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {automations.slice(0, 4).map((automation) => (
              <div
                key={automation.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-dark-800/50"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  automation.status === 'active' ? 'bg-green-500/10' : 'bg-dark-700'
                }`}>
                  <Zap className={`w-5 h-5 ${
                    automation.status === 'active' ? 'text-green-400' : 'text-dark-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{automation.name}</p>
                  <p className="text-sm text-dark-400">
                    {automation.runsToday} runs today • Last: {formatDate(automation.lastRun)}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  automation.status === 'active' ? 'bg-green-400' : 'bg-dark-500'
                }`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Products</h2>
          <Link to="/products" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-dark-400 border-b border-dark-700">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Market</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((product) => {
                const statusInfo = getStatusInfo(product.status)
                return (
                  <tr key={product.id} className="border-b border-dark-800 last:border-0">
                    <td className="py-3">
                      <Link to={`/products/${product.id}`} className="flex items-center gap-3 hover:text-primary-400 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-sm">
                          📦
                        </div>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-dark-400">{product.niche}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 text-dark-300">{product.market}</td>
                    <td className="py-3">
                      <span className={`badge ${statusInfo?.color} ${statusInfo?.textColor}`}>
                        {statusInfo?.label}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-dark-400">{formatDate(product.updatedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
