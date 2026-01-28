import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { storage } from '../lib/supabase'
import { PageLoading, CardSkeleton } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
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
  Image
} from 'lucide-react'

export default function Products() {
  const [view, setView] = useState('kanban')
  const [showNewModal, setShowNewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { products, STATUSES, updateProductStatus, addProduct, deleteProduct, loading, error } = useData()

  // Safe filtering with null checks
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false
    const name = p.name?.toLowerCase() || ''
    const niche = p.niche?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return name.includes(query) || niche.includes(query)
  })

  const getProductsByStatus = (statusId) => {
    return filteredProducts.filter(p => p?.status === statusId)
  }

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await updateProductStatus(productId, newStatus)
    } catch (err) {
      console.error('Failed to update status:', err)
      // TODO: Show toast notification
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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-dark-700 rounded w-32 mb-2 animate-pulse" />
            <div className="h-4 bg-dark-700 rounded w-64 animate-pulse" />
          </div>
          <div className="h-10 bg-dark-700 rounded w-32 animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-72">
              <div className="bg-dark-900 rounded-xl border border-dark-700 p-4">
                <div className="h-6 bg-dark-700 rounded w-32 mb-4 animate-pulse" />
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load products</h2>
        <p className="text-dark-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
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

      {/* Empty state */}
      {filteredProducts.length === 0 && !searchQuery && (
        <EmptyState
          type="products"
          title="No products yet"
          description="Add your first product to start managing your pipeline."
          action={() => setShowNewModal(true)}
          actionLabel="Add Product"
        />
      )}

      {/* No search results */}
      {filteredProducts.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-dark-400">No products match "{searchQuery}"</p>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && filteredProducts.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(STATUSES || []).map((status) => {
            const statusProducts = getProductsByStatus(status?.id)
            return (
              <div key={status?.id || Math.random()} className="flex-shrink-0 w-72">
                <div className="bg-dark-900 rounded-xl border border-dark-700 p-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${status?.color || 'bg-dark-600'}`} />
                      <h3 className="font-semibold text-white">{status?.label || 'Unknown'}</h3>
                      <span className="text-sm text-dark-400">({statusProducts.length})</span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {statusProducts.map((product) => (
                      <ProductCard
                        key={product?.id || Math.random()}
                        product={product}
                        statuses={STATUSES || []}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
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
      {view === 'list' && filteredProducts.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-dark-400 border-b border-dark-700">
                <th className="pb-3 pl-4 font-medium">Product</th>
                <th className="pb-3 font-medium">Market</th>
                <th className="pb-3 font-medium">Niche</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                if (!product) return null
                const statusInfo = (STATUSES || []).find(s => s?.id === product?.status)
                return (
                  <tr key={product.id} className="border-b border-dark-800 last:border-0 hover:bg-dark-800/50 transition-colors">
                    <td className="py-4 pl-4">
                      <Link to={`/products/${product.id}`} className="flex items-center gap-3 hover:text-primary-400 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-lg">
                          📦
                        </div>
                        <div>
                          <p className="font-medium text-white">{product.name || 'Untitled'}</p>
                          <p className="text-xs text-dark-400 mt-0.5 max-w-xs truncate">{product.description || ''}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 text-dark-300">{product.market || '-'}</td>
                    <td className="py-4 text-dark-300">{product.niche || '-'}</td>
                    <td className="py-4">
                      <span className={`badge ${statusInfo?.color || 'bg-dark-600'} ${statusInfo?.textColor || 'text-dark-300'}`}>
                        {statusInfo?.label || product.status || 'Unknown'}
                      </span>
                    </td>
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
  
  // Safety check
  if (!product) return null
  
  const statusInfo = (statuses || []).find(s => s?.id === product?.status) || {}

  return (
    <div className="bg-dark-800 rounded-lg p-4 hover:bg-dark-750 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <Link to={`/products/${product.id}`} className="font-medium text-white hover:text-primary-400 transition-colors">
          {product.name || 'Untitled Product'}
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

      <p className="text-sm text-dark-400 mb-3 line-clamp-2">{product.description || 'No description'}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-dark-400">
          <span>{product.market || '-'}</span>
          {product.niche && (
            <>
              <span>•</span>
              <span>{product.niche}</span>
            </>
          )}
        </div>
        
        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className={`badge ${statusInfo?.color || 'bg-dark-600'} ${statusInfo?.textColor || 'text-dark-300'} cursor-pointer hover:opacity-80 transition-opacity`}
          >
            {statusInfo?.label || product.status || 'Unknown'}
          </button>
          {statusMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-dark-700 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[160px]">
                {(statuses || []).map((status) => (
                  <button
                    key={status?.id || Math.random()}
                    onClick={() => { onStatusChange(product.id, status?.id); setStatusMenuOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-600 ${
                      product?.status === status?.id ? 'text-primary-400' : 'text-dark-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status?.color || 'bg-dark-600'}`} />
                    {status?.label || 'Unknown'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      {product.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {product.tags.map((tag, index) => (
            <span key={tag || index} className="text-xs px-2 py-0.5 bg-dark-700 text-dark-300 rounded">
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
    tags: '',
    // n8n workflow fields
    language: 'English',
    country: 'United States',
    gender: 'All',
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }
      setImageFile(file)
      setError('')
      // Create preview
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
    
    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      let productImageUrl = formData.product_image_url
      
      // Upload image if selected
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add New Product</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white" disabled={submitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Brief description of the product..."
              disabled={submitting}
            />
          </div>

          <div>
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
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-32 h-32 object-cover rounded-lg border border-dark-600"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  disabled={submitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-dark-600 rounded-lg p-6 hover:border-dark-500 hover:bg-dark-800/50 transition-colors"
                disabled={submitting}
              >
                <div className="flex flex-col items-center gap-2 text-dark-400">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs">PNG, JPG up to 5MB</span>
                </div>
              </button>
            )}
            <p className="text-xs text-dark-500 mt-2">Used for banner generation</p>
          </div>

          {/* Collapsible Advanced Section */}
          <div className="border border-dark-700 rounded-lg">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3 text-left text-dark-300 hover:text-white transition-colors"
            >
              <span className="text-sm font-medium">Research Links (Optional)</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </button>
            
            {showAdvanced && (
              <div className="p-3 pt-0 space-y-3 border-t border-dark-700">
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

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Competitor Link #1</label>
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
                  <label className="block text-sm font-medium text-dark-300 mb-2">Competitor Link #2</label>
                  <input
                    type="url"
                    value={formData.competitor_link_2}
                    onChange={(e) => setFormData({ ...formData, competitor_link_2: e.target.value })}
                    className="input"
                    placeholder="https://..."
                    disabled={submitting}
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
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  {uploadingImage ? 'Uploading image...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
