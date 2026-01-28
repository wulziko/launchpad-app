import { Package, Zap, Image, FolderOpen } from 'lucide-react'

const icons = {
  products: Package,
  automations: Zap,
  assets: Image,
  default: FolderOpen,
}

/**
 * Empty state component for when there's no data
 */
export default function EmptyState({ 
  type = 'default',
  title = 'No items yet',
  description = 'Get started by creating your first item.',
  action,
  actionLabel = 'Create',
}) {
  const Icon = icons[type] || icons.default

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-800 mb-4">
        <Icon className="w-8 h-8 text-dark-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-dark-400 max-w-sm mb-6">{description}</p>
      {action && (
        <button onClick={action} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
