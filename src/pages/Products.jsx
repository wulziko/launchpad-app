import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Trash2,
  Edit,
  ChevronRight,
  X
} from 'lucide-react'

export default function Products() {
  const [view, setView] = useState('kanban') // 'kanban' or 'list'
  const [showNewModal, setShowNewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { products, STATUSES, updateProductStatus, addProduct, deleteProduct } = useData()

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.niche.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getProductsByStatus = (statusId) => {
    return filteredProducts.filter(p => p.status === statusId)
  }

  const handleStatusChange = (productId, newStatus) => {
    updateProductStatus(productId, newStatus)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-dark-400 mt-1">
            Manage your product pipeline from discovery to launch
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`p-2 rounded-md transition-colors ${view === 'kanban' ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-white'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const statusProducts = getProductsByStatus(status.id)
            return (
              <div key={status.id} className="flex-shrink-0 w-72">
                <div className="bg-dark-900 rounded-xl border border-dark-700 p-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${status.color}`} />
                      <h3 className="font-semibold text-white">{status.label}</h3>
                      <span className="text-sm text-dark-400">({statusProducts.length})</span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {statusProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        statuses={STATUSES}
                        onStatusChange={handleStatusChange}
                        onDelete={deleteProduct}
                      />
                    ))}

                    {statusProducts.length === 0 && (
                      <div className="py-8 text-center text-dark-500 text-sm">
                        No products
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-dark-400 border-b border-dark-700">
                <th className="pb-3 pl-4 font-medium">Product</th>
                <th className="pb-3 font-medium">Market</th>
                <th className="pb-3 font-medium">Niche</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 pr-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const statusInfo = STATUSES.find(s => s.id === product.status)
                return (
                  <tr key={product.id} className="border-b border-dark-800 last:border-0 hover:bg-dark-800/50 transition-colors">
                    <td className="py-4 pl-4">
                      <Link to={`/products/${product.id}`} className="flex items-center gap-3 hover:text-primary-400 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-lg">
                          📦
                        </div>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-dark-400 mt-0.5 max-w-xs truncate">{product.description}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 text-dark-300">{product.market}</td>
                    <td className="py-4 text-dark-300">{product.niche}</td>
                    <td className="py-4">
                      <span className={`badge ${statusInfo?.color} ${statusInfo?.textColor}`}>
                        {statusInfo?.label}
                      </span>
                    </td>
                    <td className="py-4 text-dark-300">${product.price}</td>
                    <td className="py-4 pr-4">
                      <Link to={`/products/${product.id}`} className="btn btn-ghost p-2">
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Product Modal */}
      {showNewModal && (
        <NewProductModal
          onClose={() => setShowNewModal(false)}
          onAdd={addProduct}
        />
      )}
    </div>
  )
}

function ProductCard({ product, statuses, onStatusChange, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const statusInfo = statuses.find(s => s.id === product.status)

  return (
    <div className="bg-dark-800 rounded-lg p-4 hover:bg-dark-750 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <Link to={`/products/${product.id}`} className="font-medium text-white hover:text-primary-400 transition-colors">
          {product.name}
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-dark-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-dark-700 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[140px]">
                <Link
                  to={`/products/${product.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-dark-200 hover:bg-dark-600"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Details
                </Link>
                <button
                  onClick={() => { onDelete(product.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-dark-400 mb-3 line-clamp-2">{product.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-dark-400">
          <span>{product.market}</span>
          <span>•</span>
          <span>${product.price}</span>
        </div>
        
        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className={`badge ${statusInfo?.color} ${statusInfo?.textColor} cursor-pointer hover:opacity-80 transition-opacity`}
          >
            {statusInfo?.label}
          </button>
          {statusMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-dark-700 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[160px]">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => { onStatusChange(product.id, status.id); setStatusMenuOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-600 ${
                      product.status === status.id ? 'text-primary-400' : 'text-dark-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {product.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-dark-700 text-dark-300 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function NewProductModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    market: 'US',
    niche: '',
    targetAudience: '',
    price: '',
    tags: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd({
      ...formData,
      price: parseFloat(formData.price) || 0,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add New Product</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Smart Posture Corrector"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px]"
              placeholder="Brief description of the product..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Market *</label>
              <select
                value={formData.market}
                onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                className="input"
              >
                <option value="US">🇺🇸 United States</option>
                <option value="Israel">🇮🇱 Israel</option>
                <option value="UK">🇬🇧 United Kingdom</option>
                <option value="EU">🇪🇺 Europe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                placeholder="49.99"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Niche *</label>
            <input
              type="text"
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              className="input"
              placeholder="e.g., Health & Wellness"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Target Audience</label>
            <input
              type="text"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="input"
              placeholder="e.g., Women 35+"
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
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
