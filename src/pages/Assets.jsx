import { useState } from 'react'
import { useData } from '../context/DataContext'
import { PageLoading } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import {
  Image,
  FileText,
  Download,
  Eye,
  Search,
  Grid3X3,
  List,
  FolderOpen,
  AlertCircle
} from 'lucide-react'

export default function Assets() {
  const { products, assets, loading, error } = useData()
  const [view, setView] = useState('grid')
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Safe arrays
  const safeProducts = products || []
  const safeAssets = assets || []

  // Collect all assets from products + standalone assets
  const allAssets = [
    // Assets from the assets table
    ...safeAssets.map(asset => ({
      id: asset?.id,
      type: asset?.type || 'other',
      url: asset?.file_url || asset?.url,
      name: asset?.name || 'Unnamed',
      productId: asset?.product_id,
      productName: safeProducts.find(p => p?.id === asset?.product_id)?.name || 'Unknown',
      status: asset?.metadata?.status || 'ready',
      createdAt: asset?.created_at,
    })),
    // Legacy: assets embedded in products
    ...safeProducts.flatMap(product => {
      if (!product) return []
      const assets = []
      
      // Add banners
      if (product.banners && Array.isArray(product.banners)) {
        product.banners.forEach(banner => {
          if (!banner) return
          assets.push({
            id: banner.id || `banner-${Math.random()}`,
            type: 'banner',
            url: banner.url,
            name: 'Banner',
            productId: product.id,
            productName: product.name || 'Unknown',
            status: banner.status || 'ready',
            createdAt: product.createdAt,
          })
        })
      }
      
      // Add landing page if exists
      if (product.landingPage?.html) {
        assets.push({
          id: `lp-${product.id}`,
          type: 'landing_page',
          name: 'Landing Page',
          productId: product.id,
          productName: product.name || 'Unknown',
          status: product.landingPage.status || 'ready',
          createdAt: product.updatedAt,
        })
      }
      
      return assets
    })
  ].filter(Boolean) // Remove any null/undefined entries

  const filteredAssets = allAssets.filter(asset => {
    if (!asset) return false
    if (filter !== 'all') {
      const assetType = asset.type?.toLowerCase() || ''
      if (filter === 'banners' && assetType !== 'banner') return false
      if (filter === 'landing' && !assetType.includes('landing')) return false
    }
    if (searchQuery) {
      const productName = asset.productName?.toLowerCase() || ''
      const assetName = asset.name?.toLowerCase() || ''
      const query = searchQuery.toLowerCase()
      if (!productName.includes(query) && !assetName.includes(query)) return false
    }
    return true
  })

  const bannerCount = allAssets.filter(a => a?.type === 'banner').length
  const landingCount = allAssets.filter(a => a?.type?.includes('landing')).length

  // Loading state
  if (loading) {
    return <PageLoading message="Loading assets..." />
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load assets</h2>
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
            placeholder="Search by product or asset name..."
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

      {/* Empty state */}
      {allAssets.length === 0 ? (
        <EmptyState
          type="assets"
          title="No assets yet"
          description="Generate banners and landing pages from your products to see them here."
        />
      ) : filteredAssets.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <h3 className="text-lg font-medium text-white mb-2">No assets found</h3>
          <p className="text-dark-400">
            No {filter !== 'all' ? filter : 'assets'} match your search.
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard key={asset?.id || Math.random()} asset={asset} />
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
              {filteredAssets.map((asset) => {
                if (!asset) return null
                const isBanner = asset.type === 'banner'
                return (
                  <tr key={asset.id} className="border-b border-dark-800 last:border-0 hover:bg-dark-800/50">
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        {isBanner && asset.url ? (
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
                          {asset.name || (isBanner ? 'Banner' : 'Landing Page')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-dark-300">{asset.productName || '-'}</td>
                    <td className="py-3">
                      <span className={`badge ${
                        isBanner 
                          ? 'bg-primary-500/10 text-primary-400' 
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {isBanner ? 'Banner' : 'Landing'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`badge ${
                        asset.status === 'ready' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {asset.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button className="btn btn-ghost p-2" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        {asset.url && (
                          <button className="btn btn-ghost p-2" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AssetCard({ asset }) {
  if (!asset) return null
  
  const isBanner = asset.type === 'banner'

  return (
    <div className="card p-0 overflow-hidden group">
      {/* Preview */}
      <div className="relative aspect-square bg-dark-800">
        {isBanner && asset.url ? (
          <img
            src={asset.url}
            alt={asset.name || 'Banner'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-16 h-16 text-dark-600" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors" title="Preview">
            <Eye className="w-5 h-5 text-white" />
          </button>
          {asset.url && (
            <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors" title="Download">
              <Download className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className={`badge ${
            isBanner 
              ? 'bg-primary-500/90 text-white' 
              : 'bg-green-500/90 text-white'
          }`}>
            {isBanner ? (
              <><Image className="w-3 h-3 mr-1" /> Banner</>
            ) : (
              <><FileText className="w-3 h-3 mr-1" /> Landing</>
            )}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-medium text-white truncate">{asset.productName || 'Unknown'}</p>
        <p className="text-sm text-dark-400 mt-1">
          Status: <span className={asset.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}>
            {asset.status || 'Unknown'}
          </span>
        </p>
      </div>
    </div>
  )
}
