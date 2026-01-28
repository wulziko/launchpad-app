import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Image,
  FileText,
  Zap,
  Clock,
  DollarSign,
  Users,
  Globe,
  Tag,
  Save,
  X,
  Download,
  Eye,
  ChevronDown
} from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, STATUSES, updateProduct, updateProductStatus, deleteProduct } = useData()
  const [isEditing, setIsEditing] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const product = products.find(p => p.id === id)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-dark-400 mb-4">Product not found</p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    )
  }

  const statusInfo = STATUSES.find(s => s.id === product.status)

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id)
      navigate('/products')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'banners', label: 'Banners', icon: Image, count: product.banners.length },
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
              <h1 className="text-2xl font-bold text-white">{product.name}</h1>
              
              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  className={`badge ${statusInfo?.color} ${statusInfo?.textColor} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
                >
                  {statusInfo?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {statusMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[180px]">
                      {STATUSES.map((status) => (
                        <button
                          key={status.id}
                          onClick={() => { updateProductStatus(id, status.id); setStatusMenuOpen(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-700 ${
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
            <p className="text-dark-400">{product.description}</p>
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
            <p className="text-xl font-bold text-white">${product.price}</p>
            <p className="text-xs text-dark-400">Price</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{product.market}</p>
            <p className="text-xs text-dark-400">Market</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white truncate">{product.targetAudience || 'N/A'}</p>
            <p className="text-xs text-dark-400">Target</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <Image className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{product.banners.length}</p>
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
                  <p className="text-white">{product.niche}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400 mb-1">Target Audience</p>
                  <p className="text-white">{product.targetAudience || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.length > 0 ? product.tags.map(tag => (
                      <span key={tag} className="badge bg-dark-700 text-dark-200">
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
                value={product.notes}
                onChange={(e) => updateProduct(id, { notes: e.target.value })}
                className="input min-h-[150px]"
                placeholder="Add notes about this product..."
              />
            </div>

            <div className="card lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-dark-400">Created:</span>
                  <span className="text-white ml-2">{formatDate(product.createdAt)}</span>
                </div>
                <div>
                  <span className="text-dark-400">Last Updated:</span>
                  <span className="text-white ml-2">{formatDate(product.updatedAt)}</span>
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

            {product.banners.length === 0 ? (
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
                {product.banners.map((banner) => (
                  <div key={banner.id} className="group relative rounded-lg overflow-hidden bg-dark-800">
                    <img
                      src={banner.url}
                      alt="Banner"
                      className="w-full aspect-square object-cover"
                    />
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
              product.landingPage.status === 'ready' ? 'bg-green-500/10 border border-green-500/30' :
              product.landingPage.status === 'generating' ? 'bg-yellow-500/10 border border-yellow-500/30' :
              'bg-dark-800 border border-dark-600'
            }`}>
              <p className={`text-sm ${
                product.landingPage.status === 'ready' ? 'text-green-400' :
                product.landingPage.status === 'generating' ? 'text-yellow-400' :
                'text-dark-400'
              }`}>
                Status: {product.landingPage.status === 'ready' ? '✅ Ready' :
                        product.landingPage.status === 'generating' ? '⏳ Generating...' :
                        '⏸️ Pending'}
              </p>
            </div>

            {product.landingPage.html ? (
              <div className="bg-dark-800 rounded-lg p-4">
                <pre className="text-xs text-dark-300 overflow-x-auto">
                  {product.landingPage.html.substring(0, 500)}...
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
                  <p className="text-sm text-dark-400">{formatDate(product.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-white">Last updated</p>
                  <p className="text-sm text-dark-400">{formatDate(product.updatedAt)}</p>
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
          onSave={(updates) => { updateProduct(id, updates); setIsEditing(false) }}
        />
      )}
    </div>
  )
}

function EditProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    market: product.market,
    niche: product.niche,
    targetAudience: product.targetAudience,
    price: product.price.toString(),
    tags: product.tags.join(', '),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      price: parseFloat(formData.price) || 0,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Product</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Market</label>
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
              <label className="block text-sm font-medium text-dark-300 mb-2">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Niche</label>
            <input
              type="text"
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              className="input"
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input"
              placeholder="comma-separated"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
