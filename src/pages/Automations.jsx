import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../context/DataContext'
import { PageLoading } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import {
  Zap,
  Plus,
  Play,
  Clock,
  Settings,
  ExternalLink,
  CheckCircle2,
  X,
  Webhook,
  Calendar,
  MousePointer,
  AlertCircle
} from 'lucide-react'

export default function Automations() {
  const { automations, STATUSES, loading, error, addAutomation } = useData()
  const [showNewModal, setShowNewModal] = useState(false)

  // Safe arrays
  const safeAutomations = automations || []
  const safeStatuses = STATUSES || []

  const getTriggerIcon = (trigger) => {
    switch (trigger) {
      case 'schedule': return Calendar
      case 'status_change': return MousePointer
      case 'manual': return Play
      case 'webhook': return Webhook
      default: return Zap
    }
  }

  const getTriggerLabel = (automation) => {
    if (!automation) return ''
    const triggerType = automation.trigger_type || automation.trigger
    
    switch (triggerType) {
      case 'schedule': 
        return automation.trigger_config?.schedule || automation.schedule || 'Scheduled'
      case 'status_change': {
        const statusId = automation.trigger_config?.status || automation.triggerStatus
        const status = safeStatuses.find(s => s?.id === statusId)
        return `On status → ${status?.label || statusId || 'Unknown'}`
      }
      case 'manual': return 'Manual trigger'
      case 'webhook': return 'Webhook'
      default: return triggerType || 'Unknown'
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Never'
    try {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  // Loading state
  if (loading) {
    return <PageLoading message="Loading automations..." />
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load automations</h2>
        <p className="text-dark-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  // Stats with safe defaults
  const activeCount = safeAutomations.filter(a => a?.is_active || a?.status === 'active').length
  const runsToday = safeAutomations.reduce((sum, a) => sum + (a?.run_count || a?.runsToday || 0), 0)
  const scheduledCount = safeAutomations.filter(a => (a?.trigger_type || a?.trigger) === 'schedule').length
  const totalCount = safeAutomations.length

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Automations</h1>
          <p className="text-dark-400 mt-1">
            Manage your n8n workflows and automation triggers
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Add Automation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
              <p className="text-xs text-dark-400">Active</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{runsToday}</p>
              <p className="text-xs text-dark-400">Total Runs</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{scheduledCount}</p>
              <p className="text-xs text-dark-400">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCount}</p>
              <p className="text-xs text-dark-400">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {safeAutomations.length === 0 ? (
        <EmptyState
          type="automations"
          title="No automations yet"
          description="Connect your n8n workflows to automate product launches."
          action={() => setShowNewModal(true)}
          actionLabel="Add Automation"
        />
      ) : (
        /* Automations List */
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">All Automations</h2>
          
          <div className="space-y-3">
            {safeAutomations.map((automation) => {
              if (!automation) return null
              const triggerType = automation.trigger_type || automation.trigger || 'manual'
              const TriggerIcon = getTriggerIcon(triggerType)
              const isActive = automation.is_active || automation.status === 'active'
              const webhookUrl = automation.webhook_url || automation.webhook
              const lastRun = automation.last_run_at || automation.lastRun
              const runCount = automation.run_count || automation.runsToday || 0
              
              return (
                <div
                  key={automation.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-green-500/10' : 'bg-dark-700'
                  }`}>
                    <Zap className={`w-6 h-6 ${
                      isActive ? 'text-green-400' : 'text-dark-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{automation.name || 'Unnamed'}</h3>
                      <span className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-green-400' : 'bg-dark-500'
                      }`} />
                    </div>
                    <p className="text-sm text-dark-400 mb-2">{automation.description || 'No description'}</p>
                    <div className="flex items-center gap-4 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <TriggerIcon className="w-3 h-3" />
                        {getTriggerLabel(automation)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last: {formatDate(lastRun)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {runCount} runs
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn btn-ghost p-2" title="Run now">
                      <Play className="w-4 h-4" />
                    </button>
                    <button className="btn btn-ghost p-2" title="Settings">
                      <Settings className="w-4 h-4" />
                    </button>
                    {webhookUrl && (
                      <a
                        href={webhookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost p-2"
                        title="Open webhook"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Webhook Info */}
      <div className="card bg-gradient-to-r from-primary-500/10 to-purple-500/10 border-primary-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <Webhook className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Connect Your n8n Workflows</h3>
            <p className="text-sm text-dark-300 mb-3">
              LaunchPad can receive data from your n8n automations via webhooks. 
              Configure your workflows to POST to the LaunchPad API to automatically 
              update product statuses, add banners, or create new products.
            </p>
            <div className="flex gap-2">
              <button className="btn btn-secondary text-sm py-1.5">
                View API Docs
              </button>
              <button className="btn btn-ghost text-sm py-1.5">
                Copy Webhook URL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Automation Modal */}
      {showNewModal && (
        <NewAutomationModal 
          onClose={() => setShowNewModal(false)} 
          onAdd={addAutomation}
          statuses={safeStatuses}
        />
      )}
    </div>
  )
}

function NewAutomationModal({ onClose, onAdd, statuses }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'manual',
    triggerConfig: {},
    webhookUrl: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      await onAdd?.({
        name: formData.name.trim(),
        description: formData.description.trim(),
        triggerType: formData.triggerType,
        triggerConfig: formData.triggerConfig,
        webhookUrl: formData.webhookUrl.trim(),
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add automation')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-lg animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Automation</h2>
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
            <label className="block text-sm font-medium text-dark-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Banner Generation"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="What does this automation do?"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Trigger Type</label>
            <select
              value={formData.triggerType}
              onChange={(e) => setFormData({ ...formData, triggerType: e.target.value, triggerConfig: {} })}
              className="input"
              disabled={submitting}
            >
              <option value="manual">Manual</option>
              <option value="status_change">On Status Change</option>
              <option value="scheduled">Scheduled</option>
              <option value="webhook">Incoming Webhook</option>
            </select>
          </div>

          {formData.triggerType === 'status_change' && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Trigger on Status</label>
              <select
                value={formData.triggerConfig.status || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  triggerConfig: { ...formData.triggerConfig, status: e.target.value }
                })}
                className="input"
                disabled={submitting}
              >
                <option value="">Select status...</option>
                {(statuses || []).map(status => (
                  <option key={status?.id} value={status?.id}>{status?.label}</option>
                ))}
              </select>
            </div>
          )}

          {formData.triggerType === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Schedule</label>
              <input
                type="text"
                value={formData.triggerConfig.schedule || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  triggerConfig: { ...formData.triggerConfig, schedule: e.target.value }
                })}
                className="input"
                placeholder="e.g., 7:00 AM daily"
                disabled={submitting}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">n8n Webhook URL</label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              className="input"
              placeholder="https://n8n.example.com/webhook/..."
              disabled={submitting}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Automation
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
