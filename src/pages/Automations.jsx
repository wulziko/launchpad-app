import { useState } from 'react'
import { useData } from '../context/DataContext'
import {
  Zap,
  Plus,
  Play,
  Pause,
  Clock,
  Settings,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Webhook,
  Calendar,
  MousePointer
} from 'lucide-react'

export default function Automations() {
  const { automations, STATUSES } = useData()
  const [selectedAutomation, setSelectedAutomation] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)

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
    switch (automation.trigger) {
      case 'schedule': return automation.schedule
      case 'status_change': {
        const status = STATUSES.find(s => s.id === automation.triggerStatus)
        return `On status → ${status?.label || automation.triggerStatus}`
      }
      case 'manual': return 'Manual trigger'
      case 'webhook': return 'Webhook'
      default: return automation.trigger
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
              <p className="text-2xl font-bold text-white">
                {automations.filter(a => a.status === 'active').length}
              </p>
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
              <p className="text-2xl font-bold text-white">
                {automations.reduce((sum, a) => sum + a.runsToday, 0)}
              </p>
              <p className="text-xs text-dark-400">Runs Today</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {automations.filter(a => a.trigger === 'schedule').length}
              </p>
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
              <p className="text-2xl font-bold text-white">{automations.length}</p>
              <p className="text-xs text-dark-400">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automations List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">All Automations</h2>
        
        <div className="space-y-3">
          {automations.map((automation) => {
            const TriggerIcon = getTriggerIcon(automation.trigger)
            return (
              <div
                key={automation.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  automation.status === 'active' ? 'bg-green-500/10' : 'bg-dark-700'
                }`}>
                  <Zap className={`w-6 h-6 ${
                    automation.status === 'active' ? 'text-green-400' : 'text-dark-400'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{automation.name}</h3>
                    <span className={`w-2 h-2 rounded-full ${
                      automation.status === 'active' ? 'bg-green-400' : 'bg-dark-500'
                    }`} />
                  </div>
                  <p className="text-sm text-dark-400 mb-2">{automation.description}</p>
                  <div className="flex items-center gap-4 text-xs text-dark-500">
                    <span className="flex items-center gap-1">
                      <TriggerIcon className="w-3 h-3" />
                      {getTriggerLabel(automation)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last: {formatDate(automation.lastRun)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {automation.runsToday} runs today
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="btn btn-ghost p-2">
                    <Play className="w-4 h-4" />
                  </button>
                  <button className="btn btn-ghost p-2">
                    <Settings className="w-4 h-4" />
                  </button>
                  <a
                    href={automation.webhook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost p-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
        <NewAutomationModal onClose={() => setShowNewModal(false)} />
      )}
    </div>
  )
}

function NewAutomationModal({ onClose }) {
  const { STATUSES } = useData()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'manual',
    triggerStatus: '',
    schedule: '',
    webhook: '',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-lg animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Automation</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Banner Generation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder="What does this automation do?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Trigger Type</label>
            <select
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
              className="input"
            >
              <option value="manual">Manual</option>
              <option value="status_change">On Status Change</option>
              <option value="schedule">Scheduled</option>
              <option value="webhook">Incoming Webhook</option>
            </select>
          </div>

          {formData.trigger === 'status_change' && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Trigger on Status</label>
              <select
                value={formData.triggerStatus}
                onChange={(e) => setFormData({ ...formData, triggerStatus: e.target.value })}
                className="input"
              >
                <option value="">Select status...</option>
                {STATUSES.map(status => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
          )}

          {formData.trigger === 'schedule' && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Schedule</label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                className="input"
                placeholder="e.g., 7:00 AM daily"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">n8n Webhook URL</label>
            <input
              type="url"
              value={formData.webhook}
              onChange={(e) => setFormData({ ...formData, webhook: e.target.value })}
              className="input"
              placeholder="https://n8n.example.com/webhook/..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              <Plus className="w-5 h-5" />
              Add Automation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
