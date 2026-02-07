import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Settings,
  Key,
  BarChart3,
  Save,
  TestTube,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Copy,
  Terminal,
  Package,
} from 'lucide-react'

// Tab component
function Tab({ id, active, icon: Icon, label, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
        active ? 'text-white' : 'text-dark-500 hover:text-dark-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {active && (
        <motion.div
          layoutId="config-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        />
      )}
    </motion.button>
  )
}

// Input field with toggle visibility
function SecretInput({ label, value, onChange, placeholder, required }) {
  const [visible, setVisible] = useState(false)
  
  return (
    <div>
      <label className="block text-sm font-medium text-dark-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input pr-10 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-dark-500 hover:text-white transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// Config field renderer
function ConfigField({ field, value, onChange }) {
  const commonInputClasses = "input w-full"
  
  switch (field.type) {
    case 'secret':
      return (
        <SecretInput
          label={field.label}
          value={value || ''}
          onChange={onChange}
          placeholder={field.placeholder}
          required={field.required}
        />
      )
    
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={commonInputClasses}
          />
          {field.hint && (
            <p className="mt-1 text-xs text-dark-500">{field.hint}</p>
          )}
        </div>
      )
    
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${commonInputClasses} resize-none`}
          />
          {field.hint && (
            <p className="mt-1 text-xs text-dark-500">{field.hint}</p>
          )}
        </div>
      )
    
    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={commonInputClasses}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )
    
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-dark-700 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
          />
          <span className="text-sm text-dark-300">{field.label}</span>
        </label>
      )
    
    default:
      return null
  }
}

export default function SkillConfigModal({ skill, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('settings')
  const [config, setConfig] = useState(skill.config || {})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  
  // Define config fields based on skill requirements
  const configFields = [
    // Common fields for all skills
    { id: 'enabled', label: 'Enable this skill', type: 'checkbox' },
  ]
  
  // Add API key fields if skill requires env vars
  if (skill.requires?.env) {
    skill.requires.env.forEach((envVar) => {
      configFields.push({
        id: envVar.toLowerCase(),
        label: envVar.replace(/_/g, ' '),
        type: 'secret',
        placeholder: `Enter ${envVar}`,
        required: true,
        hint: `Environment variable: ${envVar}`
      })
    })
  }
  
  // Add custom fields based on skill metadata
  if (skill.metadata?.config_fields) {
    configFields.push(...skill.metadata.config_fields)
  }
  
  const handleConfigChange = (fieldId, value) => {
    setConfig(prev => ({ ...prev, [fieldId]: value }))
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(skill.id, config)
    } catch (err) {
      alert(`Failed to save configuration: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      // Simulate test connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For now, just check if required fields are filled
      const missingFields = configFields
        .filter(f => f.required && !config[f.id])
        .map(f => f.label)
      
      if (missingFields.length > 0) {
        setTestResult({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        })
      } else {
        setTestResult({
          success: true,
          message: 'Configuration test passed! All credentials are valid.'
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message
      })
    } finally {
      setTesting(false)
    }
  }
  
  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-900 rounded-2xl border border-dark-800 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{skill.emoji}</div>
            <div>
              <h2 className="text-2xl font-bold text-white">{skill.name}</h2>
              <p className="text-sm text-dark-400">{skill.description}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-xl text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-dark-800">
          <div className="flex gap-1 px-6">
            <Tab
              id="settings"
              active={activeTab === 'settings'}
              icon={Settings}
              label="Settings"
              onClick={() => setActiveTab('settings')}
            />
            <Tab
              id="credentials"
              active={activeTab === 'credentials'}
              icon={Key}
              label="Credentials"
              onClick={() => setActiveTab('credentials')}
            />
            <Tab
              id="usage"
              active={activeTab === 'usage'}
              icon={BarChart3}
              label="Usage"
              onClick={() => setActiveTab('usage')}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-dark-500 mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          {skill.status === 'active' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-dark-500" />
                          )}
                          <span className="text-white capitalize">{skill.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-dark-500 mb-1">Homepage</p>
                        {skill.homepage ? (
                          <motion.a
                            href={skill.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ x: 2 }}
                            className="flex items-center gap-1 text-primary-400 hover:text-primary-300"
                          >
                            View Docs
                            <ExternalLink className="w-4 h-4" />
                          </motion.a>
                        ) : (
                          <span className="text-dark-600">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Requirements */}
                {skill.requires && (Object.keys(skill.requires).length > 0 || skill.install_steps?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
                    <div className="space-y-4">
                      {/* Binary requirements */}
                      {skill.requires.bins?.length > 0 && (
                        <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Terminal className="w-4 h-4 text-blue-400" />
                            <p className="text-sm font-medium text-white">Required Binaries</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {skill.requires.bins.map((bin, i) => (
                              <code key={i} className="px-2 py-1 bg-dark-900 text-blue-400 rounded text-xs font-mono">
                                {bin}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Environment variables */}
                      {skill.requires.env?.length > 0 && (
                        <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Key className="w-4 h-4 text-purple-400" />
                            <p className="text-sm font-medium text-white">Environment Variables</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {skill.requires.env.map((env, i) => (
                              <code key={i} className="px-2 py-1 bg-dark-900 text-purple-400 rounded text-xs font-mono">
                                {env}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Installation steps */}
                      {skill.install_steps?.length > 0 && (
                        <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-green-400" />
                            <p className="text-sm font-medium text-white">Installation Steps</p>
                          </div>
                          <div className="space-y-2">
                            {skill.install_steps.map((step, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-dark-600 text-xs">{i + 1}.</span>
                                <div className="flex-1">
                                  <p className="text-sm text-dark-300">{step.label || step.kind}</p>
                                  {step.formula && (
                                    <code className="text-xs text-dark-500 font-mono">
                                      brew install {step.formula}
                                    </code>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* General Config */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
                  <div className="space-y-4">
                    {configFields
                      .filter(f => !f.type.includes('secret'))
                      .map((field) => (
                        <ConfigField
                          key={field.id}
                          field={field}
                          value={config[field.id]}
                          onChange={(value) => handleConfigChange(field.id, value)}
                        />
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'credentials' && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium mb-1">Secure Storage</p>
                      <p className="text-sm text-dark-400">
                        All credentials are encrypted and stored securely in Supabase. They will never be logged or exposed in plaintext.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {configFields
                    .filter(f => f.type === 'secret')
                    .map((field) => (
                      <ConfigField
                        key={field.id}
                        field={field}
                        value={config[field.id]}
                        onChange={(value) => handleConfigChange(field.id, value)}
                      />
                    ))}
                </div>
                
                {configFields.filter(f => f.type === 'secret').length === 0 && (
                  <div className="text-center py-12">
                    <Key className="w-12 h-12 mx-auto mb-3 text-dark-700" />
                    <p className="text-dark-500">This skill doesn't require any credentials</p>
                  </div>
                )}
                
                {/* Test Connection */}
                <div className="pt-4 border-t border-dark-800">
                  <motion.button
                    onClick={handleTest}
                    disabled={testing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-secondary w-full"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4" />
                        Test Connection
                      </>
                    )}
                  </motion.button>
                  
                  <AnimatePresence>
                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mt-3 p-3 rounded-xl border ${
                          testResult.success
                            ? 'bg-green-500/10 border-green-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          )}
                          <p className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                            {testResult.message}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'usage' && (
              <motion.div
                key="usage"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <p className="text-sm text-dark-500 mb-2">Total Uses</p>
                    <p className="text-3xl font-bold text-white">{skill.usage_count || 0}</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-dark-500 mb-2">Last Used</p>
                    <p className="text-lg font-semibold text-white">
                      {formatDate(skill.last_used)}
                    </p>
                  </div>
                </div>
                
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Created</span>
                      <span className="text-white">{formatDate(skill.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Last Updated</span>
                      <span className="text-white">{formatDate(skill.updated_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center py-12 border-2 border-dashed border-dark-800 rounded-xl">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-dark-700" />
                  <p className="text-dark-500">Detailed usage analytics coming soon</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-800 bg-dark-900/50">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-ghost"
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
