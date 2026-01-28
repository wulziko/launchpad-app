import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { PageLoading } from '../components/LoadingSpinner'
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
  AlertCircle
} from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, STATUSES, updateProduct, updateProductStatus, deleteProduct, loading, error } = useData()
  const [isEditing, setIsEditing] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Safe arrays
  const safeProducts = products || []
  const safeStatuses = STATUSES || []

  // Loading state
  if (loading) {
    return <PageLoading message="Loading product..." />
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load product</h2>
        <p className="text-dark-400 mb-4">{error}</p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    )
  }

  const product = safeProducts.find(p => p?.id === id)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-dark-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Product not found</h2>
        <p className="text-dark-400 mb-4">This product may have been deleted.</p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    )
  }

  // Safe access to product properties
  const productName = product.name || 'Untitled Product'
  const productDescription = product.description || ''
  const productPrice = product.price || 0
  const productMarket = product.market || '-'
  const productNiche = product.niche || '-'
  const productTargetAudience = product.targetAudience || 'Not specified'
  const productTags = product.tags || []
  const productNotes = product.notes || ''
  const productBanners = product.banners || []
  const productLandingPage = product.landingPage || { html: '', status: 'pending' }
  const productCreatedAt = product.createdAt || product.created_at
  const productUpdatedAt = product.updatedAt || product.updated_at

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

  const handleStatusChange = async (newStatus) => {
    try {
      await updateProductStatus?.(id, newStatus)
      setStatusMenuOpen(false)
    } catch (err) {
      console.error('Failed to update status:', err)
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/products')}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{productName}</h1>
              
              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  className={`badge ${statusInfo?.color || 'bg-dark-600'} ${statusInfo?.textColor || 'text-dark-300'} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
                >
                  {statusInfo?.label || product?.status || 'Unknown'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {statusMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[180px]">
                      {safeStatuses.map((status) => (
                        <button
                          key={status?.id || Math.random()}
                          onClick={() => handleStatusChange(status?.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-700 ${
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
            <p className="text-dark-400">{productDescription || 'No description'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button onClick={handleDelete} className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">${productPrice}</p>
            <p className="text-xs text-dark-400">Price</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{productMarket}</p>
            <p className="text-xs text-dark-400">Market</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white truncate">{productTargetAudience}</p>
            <p className="text-xs text-dark-400">Target</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <Image className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{productBanners.length}</p>
            <p className="text-xs text-dark-400">Banners</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-700">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 text-xs bg-dark-700 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Product Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-dark-400 mb-1">Niche</p>
                  <p className="text-white">{productNiche}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400 mb-1">Target Audience</p>
                  <p className="text-white">{productTargetAudience}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {productTags.length > 0 ? productTags.map((tag, i) => (
                      <span key={tag || i} className="badge bg-dark-700 text-dark-200">
                        {tag}
                      </span>
                    )) : (
                      <span className="text-dark-500">No tags</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
              <textarea
                value={productNotes}
                onChange={(e) => updateProduct?.(id, { notes: e.target.value })}
                className="input min-h-[150px]"
                placeholder="Add notes about this product..."
              />
            </div>

            <div className="card lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-dark-400">Created:</span>
                  <span className="text-white ml-2">{formatDate(productCreatedAt)}</span>
                </div>
                <div>
                  <span className="text-dark-400">Last Updated:</span>
                  <span className="text-white ml-2">{formatDate(productUpdatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Generated Banners</h3>
              <button className="btn btn-secondary">
                <Zap className="w-4 h-4" />
                Generate More
              </button>
            </div>

            {productBanners.length === 0 ? (
              <div className="text-center py-12 text-dark-400">
                <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No banners generated yet</p>
                <button className="btn btn-primary">
                  <Zap className="w-4 h-4" />
                  Start Banner Generation
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {productBanners.map((banner, i) => (
                  <div key={banner?.id || i} className="group relative rounded-lg overflow-hidden bg-dark-800">
                    {banner?.url ? (
                      <img
                        src={banner.url}
                        alt="Banner"
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center">
                        <Image className="w-12 h-12 text-dark-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                      <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'landing' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Landing Page</h3>
              <div className="flex gap-2">
                <button className="btn btn-secondary">
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button className="btn btn-primary">
                  <Zap className="w-4 h-4" />
                  Generate
                </button>
              </div>
            </div>

            <div className={`p-3 rounded-lg mb-4 ${
              productLandingPage.status === 'ready' ? 'bg-green-500/10 border border-green-500/30' :
              productLandingPage.status === 'generating' ? 'bg-yellow-500/10 border border-yellow-500/30' :
              'bg-dark-800 border border-dark-600'
            }`}>
              <p className={`text-sm ${
                productLandingPage.status === 'ready' ? 'text-green-400' :
                productLandingPage.status === 'generating' ? 'text-yellow-400' :
                'text-dark-400'
              }`}>
                Status: {productLandingPage.status === 'ready' ? '✅ Ready' :
                        productLandingPage.status === 'generating' ? '⏳ Generating...' :
                        '⏸️ Pending'}
              </p>
            </div>

            {productLandingPage.html ? (
              <div className="bg-dark-800 rounded-lg p-4">
                <pre className="text-xs text-dark-300 overflow-x-auto">
                  {productLandingPage.html.substring(0, 500)}...
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No landing page content yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                <div>
                  <p className="text-white">Product created</p>
                  <p className="text-sm text-dark-400">{formatDate(productCreatedAt)}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-white">Last updated</p>
                  <p className="text-sm text-dark-400">{formatDate(productUpdatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
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
    // n8n workflow fields
    language: product?.language || 'English',
    country: product?.country || 'United States',
    gender: product?.gender || 'All',
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
        // n8n workflow fields
        language: formData.language,
        country: formData.country,
        gender: formData.gender,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Product</h2>
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
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-dark-300 mb-2">Product Image URL</label>
            <input
              type="url"
              value={formData.product_image_url}
              onChange={(e) => setFormData({ ...formData, product_image_url: e.target.value })}
              className="input"
              placeholder="https://example.com/product-image.jpg"
              disabled={submitting}
            />
            <p className="text-xs text-dark-500 mt-1">Used for banner generation</p>
          </div>

          {/* Collapsible Advanced Section */}
          <div className="border border-dark-700 rounded-lg">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3 text-left text-dark-300 hover:text-white transition-colors"
            >
              <span className="text-sm font-medium">Research Links & More</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
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
                  <label className="block text-sm font-medium text-dark-300 mb-2">Market</label>
                  <select
                    value={formData.market}
                    onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                    className="input"
                    disabled={submitting}
                  >
                    <option value="US">🇺🇸 United States</option>
                    <option value="Israel">🇮🇱 Israel</option>
                    <option value="UK">🇬🇧 United Kingdom</option>
                    <option value="EU">🇪🇺 Europe</option>
                  </select>
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
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
