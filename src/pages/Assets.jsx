import { useState } from 'react'
import { useData } from '../context/DataContext'
import {
  Image,
  FileText,
  Download,
  Eye,
  Filter,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Trash2,
  ExternalLink,
  FolderOpen
} from 'lucide-react'

export default function Assets() {
  const { products } = useData()
  const [view, setView] = useState('grid')
  const [filter, setFilter] = useState('all') // 'all', 'banners', 'landing'
  const [searchQuery, setSearchQuery] = useState('')

  // Collect all assets from all products
  const allAssets = products.flatMap(product => {
    const assets = []
    
    // Add banners
    product.banners.forEach(banner => {
      assets.push({
        id: banner.id,
        type: 'banner',
        url: banner.url,
        productId: product.id,
        productName: product.name,
        status: banner.status,
        createdAt: product.createdAt,
      })
    })
    
    // Add landing page if exists
    if (product.landingPage.html) {
      assets.push({
        id: `lp-${product.id}`,
        type: 'landing',
        productId: product.id,
        productName: product.name,
        status: product.landingPage.status,
        createdAt: product.updatedAt,
      })
    }
    
    return assets
  })

  const filteredAssets = allAssets.filter(asset => {
    if (filter !== 'all' && filter !== asset.type + 's') return false
    if (searchQuery && !asset.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const bannerCount = allAssets.filter(a => a.type === 'banner').length
  const landingCount = allAssets.filter(a => a.type === 'landing').length

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets</h1>
          <p className="text-dark-400 mt-1">
            All your generated banners and landing pages in one place
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{allAssets.length}</p>
              <p className="text-xs text-dark-400">Total Assets</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Image className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{bannerCount}</p>
              <p className="text-xs text-dark-400">Banners</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{landingCount}</p>
              <p className="text-xs text-dark-400">Landing Pages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {/* Filter Tabs */}
          <div className="flex bg-dark-800 rounded-lg p-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'banners', label: 'Banners' },
              { id: 'landing', label: 'Landing' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === tab.id
                    ? 'bg-dark-600 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-md transition-colors ${
                view === 'grid' ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-colors ${
                view === 'list' ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Assets Display */}
      {filteredAssets.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <h3 className="text-lg font-medium text-white mb-2">No assets found</h3>
          <p className="text-dark-400">
            {filter !== 'all' 
              ? `No ${filter} match your search.`
              : 'Generate banners and landing pages from your products to see them here.'
            }
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-dark-400 border-b border-dark-700">
                <th className="pb-3 pl-4 font-medium">Asset</th>
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="border-b border-dark-800 last:border-0 hover:bg-dark-800/50">
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-3">
                      {asset.type === 'banner' ? (
                        <img
                          src={asset.url}
                          alt="Banner"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-dark-400" />
                        </div>
                      )}
                      <span className="text-white font-medium">
                        {asset.type === 'banner' ? 'Banner' : 'Landing Page'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-dark-300">{asset.productName}</td>
                  <td className="py-3">
                    <span className={`badge ${
                      asset.type === 'banner' 
                        ? 'bg-primary-500/10 text-primary-400' 
                        : 'bg-green-500/10 text-green-400'
                    }`}>
                      {asset.type === 'banner' ? 'Banner' : 'Landing'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`badge ${
                      asset.status === 'ready' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button className="btn btn-ghost p-2">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="btn btn-ghost p-2">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AssetCard({ asset }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="card p-0 overflow-hidden group">
      {/* Preview */}
      <div className="relative aspect-square bg-dark-800">
        {asset.type === 'banner' ? (
          <img
            src={asset.url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-16 h-16 text-dark-600" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
            <Eye className="w-5 h-5 text-white" />
          </button>
          <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className={`badge ${
            asset.type === 'banner' 
              ? 'bg-primary-500/90 text-white' 
              : 'bg-green-500/90 text-white'
          }`}>
            {asset.type === 'banner' ? (
              <><Image className="w-3 h-3 mr-1" /> Banner</>
            ) : (
              <><FileText className="w-3 h-3 mr-1" /> Landing</>
            )}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-medium text-white truncate">{asset.productName}</p>
        <p className="text-sm text-dark-400 mt-1">
          Status: <span className={asset.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}>
            {asset.status}
          </span>
        </p>
      </div>
    </div>
  )
}
