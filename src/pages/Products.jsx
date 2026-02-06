import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useData } from '../context/DataContext'
import { storage } from '../lib/supabase'
import { PageLoading, CardSkeleton } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { MiniConfetti } from '../components/Confetti'
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Trash2,
  ChevronRight,
  X,
  AlertCircle,
  Upload,
  Image,
  Sparkles,
  Package,
  Star,
  Zap,
  CheckCircle2,
  Check,
} from 'lucide-react'

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

// Column animation variants
const columnVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

// Skeleton card for loading state
function ProductCardSkeleton({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 bg-dark-700 rounded-lg w-3/4 skeleton" />
        <div className="w-6 h-6 bg-dark-700 rounded skeleton" />
      </div>
      <div className="h-4 bg-dark-700 rounded w-full mb-2 skeleton" />
      <div className="h-4 bg-dark-700 rounded w-2/3 mb-4 skeleton" />
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="h-3 bg-dark-700 rounded w-12 skeleton" />
          <div className="h-3 bg-dark-700 rounded w-16 skeleton" />
        </div>
        <div className="h-6 bg-dark-700 rounded-lg w-20 skeleton" />
      </div>
    </motion.div>
  )
}

export default function Products() {
  const [view, setView] = useState('kanban')
  const [showNewModal, setShowNewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkMenu, setShowBulkMenu] = useState(false)
  const [celebratingCard, setCelebratingCard] = useState(null)
  const { products, STATUSES, updateProductStatus, addProduct, deleteProduct, loading, error } = useData()

  const filteredProducts = (products || []).filter(p => {
    if (!p) return false
    
    // Search filter
    const name = p.name?.toLowerCase() || ''
    const niche = p.niche?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    const matchesSearch = name.includes(query) || niche.includes(query)
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getProductsByStatus = (statusId) => {
    return filteredProducts.filter(p => p?.status === statusId)
  }

  const handleStatusChange = async (productId, newStatus, oldStatus) => {
    try {
      await updateProductStatus(productId, newStatus)
      
      // Celebrate when moving to "live" status
      if (newStatus === 'live' && oldStatus !== 'live') {
        setCelebratingCard(productId)
        setTimeout(() => setCelebratingCard(null), 2000)
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct(productId)
    } catch (err) {
      console.error('Failed to delete product:', err)
    }
  }

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map(p => p.id))
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkStatusChange = async (newStatus) => {
    if (!selectedIds.length) return
    
    try {
      await Promise.all(selectedIds.map(id => updateProductStatus(id, newStatus)))
      setSelectedIds([])
      setShowBulkMenu(false)
    } catch (err) {
      console.error('Bulk status update failed:', err)
      alert('Failed to update some products')
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} product(s)?`)) return
    
    try {
      await Promise.all(selectedIds.map(id => deleteProduct(id)))
      setSelectedIds([])
    } catch (err) {
      console.error('Bulk delete failed:', err)
      alert('Failed to delete some products')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-4 bg-dark-800 rounded w-24 mb-2 skeleton" />
            <div className="h-8 bg-dark-800 rounded-lg w-32 mb-2 skeleton" />
            <div className="h-4 bg-dark-800 rounded w-64 skeleton" />
          </div>
          <div className="h-10 bg-dark-800 rounded-xl w-32 skeleton" />
        </div>
        
        {/* Toolbar skeleton */}
        <div className="flex gap-4">
          <div className="flex-1 h-12 bg-dark-800 rounded-xl skeleton" />
          <div className="h-12 bg-dark-800 rounded-xl w-24 skeleton" />
          <div className="h-12 bg-dark-800 rounded-xl w-24 skeleton" />
        </div>
        
        {/* Kanban skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-72">
              <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-dark-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-dark-700 skeleton" />
                  <div className="h-5 bg-dark-700 rounded w-24 skeleton" />
                  <div className="h-5 bg-dark-700 rounded-full w-8 skeleton" />
                </div>
                <div className="space-y-3">
                  <ProductCardSkeleton index={0} />
                  <ProductCardSkeleton index={1} />
                  {i < 3 && <ProductCardSkeleton index={2} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load products</h2>
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
    <div className="space-y-6">
      {/* Header */}
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
            <Package className="w-5 h-5 text-primary-400" />
            <span className="text-sm text-primary-400 font-medium">Product Pipeline</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-bold text-white"
          >
            Products
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-dark-400 mt-1"
          >
            Manage your product pipeline from discovery to launch
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <motion.button
            onClick={() => setShowNewModal(true)}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -15px rgba(236, 72, 153, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleSelectAll}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-primary-500/20 rounded-lg transition-colors"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedIds.length === filteredProducts.length 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-primary-400'
                }`}>
                  {selectedIds.length > 0 && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </div>
              </motion.button>
              <span className="text-sm font-medium text-white">
                {selectedIds.length} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Change Status Dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-secondary btn-sm"
                >
                  Change Status
                  <ChevronRight className="w-4 h-4 ml-1" />
                </motion.button>

                <AnimatePresence>
                  {showBulkMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-full mt-2 right-0 z-20 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden"
                      >
                        <div className="max-h-64 overflow-y-auto py-1">
                          {STATUSES.map(status => (
                            <button
                              key={status.id}
                              onClick={() => handleBulkStatusChange(status.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-dark-700 transition-colors text-dark-300"
                            >
                              <div className={`w-2 h-2 rounded-full ${status.color}`} />
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Delete Button */}
              <motion.button
                onClick={handleBulkDelete}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </motion.button>

              {/* Clear Selection */}
              <motion.button
                onClick={() => setSelectedIds([])}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-dark-400" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <motion.input
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-dark-400 hover:text-white" />
            </motion.button>
          )}
        </div>
        <div className="flex gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`btn ${filterStatus !== 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Filter className="w-4 h-4" />
              {filterStatus === 'all' ? 'Filter' : STATUSES.find(s => s.id === filterStatus)?.label || 'Filter'}
              {filterStatus !== 'all' && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary-500/20 rounded text-xs">1</span>
              )}
            </motion.button>
            
            <AnimatePresence>
              {showFilterMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowFilterMenu(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 z-20 w-64 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-2 border-b border-dark-700">
                      <p className="text-xs font-semibold text-dark-400 px-2 py-1">Filter by Status</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto py-1">
                      <button
                        onClick={() => {
                          setFilterStatus('all')
                          setShowFilterMenu(false)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-dark-700 transition-colors ${
                          filterStatus === 'all' ? 'text-primary-400 bg-dark-700/50' : 'text-dark-300'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${filterStatus === 'all' ? 'bg-primary-500' : 'bg-dark-600'}`} />
                        All Products
                        <span className="ml-auto text-xs text-dark-500">{(products || []).length}</span>
                      </button>
                      {STATUSES.map((status) => {
                        const count = (products || []).filter(p => p.status === status.id).length
                        return (
                          <button
                            key={status.id}
                            onClick={() => {
                              setFilterStatus(status.id)
                              setShowFilterMenu(false)
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-dark-700 transition-colors ${
                              filterStatus === status.id ? 'text-white bg-dark-700/50' : 'text-dark-300'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            {status.label}
                            <span className="ml-auto text-xs text-dark-500">{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="flex bg-dark-800/50 border border-dark-700 rounded-xl p-1">
            <motion.button
              onClick={() => setView('kanban')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-all ${
                view === 'kanban' 
                  ? 'bg-dark-700 text-white shadow-sm' 
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setView('list')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-all ${
                view === 'list' 
                  ? 'bg-dark-700 text-white shadow-sm' 
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Empty state */}
      <AnimatePresence mode="wait">
        {filteredProducts.length === 0 && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <EmptyState
              type="products"
              title="No products yet"
              description="Add your first product to start managing your pipeline."
              action={() => setShowNewModal(true)}
              actionLabel="Add Product"
            />
          </motion.div>
        )}

        {filteredProducts.length === 0 && (searchQuery || filterStatus !== 'all') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 mx-auto mb-4 text-dark-600" />
            <p className="text-dark-400 mb-3">
              {searchQuery && filterStatus !== 'all' 
                ? `No products match "${searchQuery}" with status "${STATUSES.find(s => s.id === filterStatus)?.label}"`
                : searchQuery 
                  ? `No products match "${searchQuery}"`
                  : `No products with status "${STATUSES.find(s => s.id === filterStatus)?.label}"`
              }
            </p>
            <motion.button
              onClick={() => {
                setSearchQuery('')
                setFilterStatus('all')
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-secondary btn-sm"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban View */}
      <AnimatePresence mode="wait">
        {view === 'kanban' && filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6"
          >
            <LayoutGroup>
              {(STATUSES || []).map((status, columnIndex) => {
                const statusProducts = getProductsByStatus(status?.id)
                return (
                  <motion.div
                    key={status?.id || Math.random()}
                    custom={columnIndex}
                    variants={columnVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-shrink-0 w-72"
                  >
                    <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-dark-800 p-4">
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <motion.span
                            className={`w-3 h-3 rounded-full ${status?.color || 'bg-dark-600'}`}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2, delay: columnIndex * 0.2 }}
                          />
                          <h3 className="font-semibold text-white">{status?.label || 'Unknown'}</h3>
                          <span className="text-sm text-dark-500 bg-dark-800 px-2 py-0.5 rounded-full">
                            {statusProducts.length}
                          </span>
                        </div>
                        {status?.id === 'live' && statusProducts.length > 0 && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Star className="w-4 h-4 text-yellow-400" />
                          </motion.div>
                        )}
                      </div>

                      {/* Cards */}
                      <AnimatePresence mode="popLayout">
                        <div className="space-y-3">
                          {statusProducts.map((product, cardIndex) => (
                            <ProductCard
                              key={product?.id || Math.random()}
                              product={product}
                              statuses={STATUSES || []}
                              onStatusChange={handleStatusChange}
                              onDelete={handleDelete}
                              index={cardIndex}
                              isCelebrating={celebratingCard === product?.id}
                            />
                          ))}

                          {statusProducts.length === 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="py-8 text-center text-dark-600 text-sm border-2 border-dashed border-dark-800 rounded-xl"
                            >
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              No products
                            </motion.div>
                          )}
                        </div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List View */}
      <AnimatePresence mode="wait">
        {view === 'list' && filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-dark-500 border-b border-dark-800">
                  <th className="pb-4 pl-4 font-medium">Product</th>
                  <th className="pb-4 font-medium">Market</th>
                  <th className="pb-4 font-medium">Niche</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 pr-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => {
                  if (!product) return null
                  const statusInfo = (STATUSES || []).find(s => s?.id === product?.status)
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-dark-800/50 last:border-0 group hover:bg-dark-800/30"
                    >
                      <td className="py-4 pl-4">
                        <Link to={`/products/${product.id}`} className="flex items-center gap-3">
                          {/* Thumbnail preview */}
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-lg overflow-hidden"
                          >
                            {product.product_image_url ? (
                              <img 
                                src={product.product_image_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>📦</span>
                            )}
                          </motion.div>
                          <div>
                            <p className="font-medium text-white group-hover:text-primary-400 transition-colors">
                              {product.name || 'Untitled'}
                            </p>
                            <p className="text-xs text-dark-500 mt-0.5 max-w-xs truncate">
                              {product.description || ''}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 text-dark-400">{product.market || '-'}</td>
                      <td className="py-4 text-dark-400">{product.niche || '-'}</td>
                      <td className="py-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`badge ${statusInfo?.color || 'bg-dark-700'} ${statusInfo?.textColor || 'text-dark-300'}`}
                        >
                          {statusInfo?.label || product.status || 'Unknown'}
                        </motion.span>
                      </td>
                      <td className="py-4 pr-4">
                        <Link to={`/products/${product.id}`}>
                          <motion.button
                            whileHover={{ scale: 1.1, x: 2 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-dark-500 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </motion.button>
                        </Link>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Product Modal */}
      <AnimatePresence>
        {showNewModal && (
          <NewProductModal
            onClose={() => setShowNewModal(false)}
            onAdd={addProduct}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductCard({ product, statuses, onStatusChange, onDelete, index, isCelebrating }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef(null)
  
  if (!product) return null
  
  const statusInfo = (statuses || []).find(s => s?.id === product?.status) || {}
  const isLive = product?.status === 'live'

  return (
    <motion.div
      ref={cardRef}
      layout
      layoutId={product.id}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative bg-dark-800/50 backdrop-blur-sm border rounded-xl p-4 group cursor-pointer transition-colors ${
        isLive ? 'border-yellow-500/30' : 'border-dark-700/50'
      } ${isCelebrating ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-dark-900' : ''}`}
    >
      {/* Celebration confetti */}
      <MiniConfetti active={isCelebrating} />
      
      {/* Live glow effect */}
      {isLive && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-yellow-500/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      {/* Product Layout: Image + Content */}
      <div className="flex gap-3 mb-3">
        {/* Product Image Preview */}
        <div className="flex-shrink-0">
          {product.product_image_url || product.metadata?.product_image_url ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-dark-600 bg-dark-900">
              <img 
                src={product.product_image_url || product.metadata?.product_image_url} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg border border-dark-600 bg-dark-900 flex items-center justify-center">
              <Image className="w-6 h-6 text-dark-600" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <Link 
              to={`/products/${product.id}`} 
              className="font-medium text-white hover:text-primary-400 transition-colors flex-1 line-clamp-1"
            >
              {product.name || 'Untitled Product'}
            </Link>
            <div className="relative">
              <motion.button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 text-dark-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-dark-700"
              >
                <MoreVertical className="w-4 h-4" />
              </motion.button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-1 z-20 bg-dark-800 border border-dark-700 rounded-xl shadow-xl py-1 min-w-[140px] overflow-hidden"
                    >
                      <Link
                        to={`/products/${product.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </Link>
                      <button
                        onClick={() => { onDelete(product.id); setMenuOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Product Metadata */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-dark-500">
            {product.niche && (
              <span className="truncate">{product.niche}</span>
            )}
            {(product.country || product.metadata?.country) && (
              <>
                {product.niche && <span className="w-1 h-1 rounded-full bg-dark-600" />}
                <span className="truncate">{product.country || product.metadata?.country}</span>
              </>
            )}
            {product.created_at && (
              <>
                {(product.niche || product.country || product.metadata?.country) && (
                  <span className="w-1 h-1 rounded-full bg-dark-600" />
                )}
                <span className="truncate">
                  {new Date(product.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex-1" />
        
        {/* Status Dropdown */}
        <div className="relative">
          <motion.button
            onClick={(e) => { e.stopPropagation(); setStatusMenuOpen(!statusMenuOpen) }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`badge ${statusInfo?.color || 'bg-dark-700'} ${statusInfo?.textColor || 'text-dark-300'} cursor-pointer`}
          >
            {statusInfo?.label || product.status || 'Unknown'}
          </motion.button>
          <AnimatePresence>
            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 z-20 bg-dark-800 border border-dark-700 rounded-xl shadow-xl py-1 min-w-[160px] overflow-hidden"
                >
                  {(statuses || []).map((status) => (
                    <motion.button
                      key={status?.id || Math.random()}
                      onClick={() => { 
                        onStatusChange(product.id, status?.id, product.status)
                        setStatusMenuOpen(false) 
                      }}
                      whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        product?.status === status?.id ? 'text-primary-400' : 'text-dark-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${status?.color || 'bg-dark-600'}`} />
                      {status?.label || 'Unknown'}
                      {status?.id === 'live' && product?.status !== 'live' && (
                        <Zap className="w-3 h-3 text-yellow-400 ml-auto" />
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tags */}
      {product.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {product.tags.slice(0, 3).map((tag, i) => (
            <motion.span
              key={tag || i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="text-xs px-2 py-0.5 bg-dark-700/50 text-dark-400 rounded-md"
            >
              {tag}
            </motion.span>
          ))}
          {product.tags.length > 3 && (
            <span className="text-xs px-2 py-0.5 text-dark-500">
              +{product.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

function NewProductModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    market: 'US',
    niche: '',
    targetAudience: '',
    tags: '',
    language: 'English',
    country: 'United States',
    gender: 'All',
    aliexpress_link: '',
    amazon_link: '',
    competitor_link_1: '',
    competitor_link_2: '',
    product_image_url: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }
      setImageFile(file)
      setError('')
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Product name is required')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      let productImageUrl = formData.product_image_url
      
      if (imageFile) {
        setUploadingImage(true)
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `product-images/${fileName}`
        
        await storage.upload('products', filePath, imageFile)
        productImageUrl = storage.getPublicUrl('products', filePath)
        setUploadingImage(false)
      }
      
      await onAdd({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        niche: formData.niche.trim(),
        product_image_url: productImageUrl,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      onClose()
    } catch (err) {
      console.error('Error adding product:', err)
      setError(err.message || 'Failed to add product. Please try again.')
      setUploadingImage(false)
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
              className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-primary-400" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Product</h2>
              <p className="text-sm text-dark-500">Create a new product in your pipeline</p>
            </div>
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

        <form onSubmit={handleSubmit} className="space-y-5">
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
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-medium text-dark-300 mb-2">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Smart Posture Corrector"
              required
              disabled={submitting}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px] resize-none"
              placeholder="Brief description of the product..."
              disabled={submitting}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-dark-300 mb-2">Niche *</label>
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-dark-300 mb-2">Product Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={submitting}
            />
            {imagePreview ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative inline-block"
              >
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-32 h-32 object-cover rounded-xl border border-dark-700"
                />
                <motion.button
                  type="button"
                  onClick={removeImage}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                  disabled={submitting}
                >
                  <X className="w-3 h-3" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.01, borderColor: 'rgba(236, 72, 153, 0.5)' }}
                whileTap={{ scale: 0.99 }}
                className="w-full border-2 border-dashed border-dark-700 rounded-xl p-6 hover:bg-dark-800/50 transition-all"
                disabled={submitting}
              >
                <div className="flex flex-col items-center gap-2 text-dark-500">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs">PNG, JPG up to 5MB</span>
                </div>
              </motion.button>
            )}
            <p className="text-xs text-dark-600 mt-2">Used for banner generation</p>
          </motion.div>

          {/* Collapsible Advanced Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="border border-dark-700 rounded-xl overflow-hidden"
          >
            <motion.button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
              className="w-full flex items-center justify-between p-4 text-left text-dark-400 hover:text-white transition-colors"
            >
              <span className="text-sm font-medium">Research Links (Optional)</span>
              <motion.div
                animate={{ rotate: showAdvanced ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-4 border-t border-dark-700">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Aliexpress Link</label>
                      <input
                        type="url"
                        value={formData.aliexpress_link}
                        onChange={(e) => setFormData({ ...formData, aliexpress_link: e.target.value })}
                        className="input"
                        placeholder="https://aliexpress.com/item/..."
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
                        placeholder="https://amazon.com/dp/..."
                        disabled={submitting}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Competitor #1</label>
                        <input
                          type="url"
                          value={formData.competitor_link_1}
                          onChange={(e) => setFormData({ ...formData, competitor_link_1: e.target.value })}
                          className="input"
                          placeholder="https://..."
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
                          placeholder="https://..."
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
                        placeholder="e.g., Women 35+"
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
                        placeholder="e.g., trending, tech, high-margin"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3 pt-4"
          >
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
                  {uploadingImage ? 'Uploading...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Product
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  )
}
