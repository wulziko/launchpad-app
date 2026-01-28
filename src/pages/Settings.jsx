import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  User,
  Bell,
  Palette,
  Link,
  Key,
  Shield,
  Save,
  Check,
  ExternalLink,
  Webhook
} from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: 'guy@example.com',
    timezone: 'Asia/Jerusalem',
  })

  const [integrations, setIntegrations] = useState({
    n8nWebhook: 'https://n8n.example.com/webhook/',
    shopifyStore: '',
    shopifyApiKey: '',
  })

  const [notifications, setNotifications] = useState({
    productUpdates: true,
    automationRuns: true,
    dailyDigest: false,
  })

  const handleSave = () => {
    // Simulate save
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-dark-700 text-white'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-6">Profile Settings</h2>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dark-700">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl">
                  {user?.avatar || '👨‍💼'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                  <p className="text-dark-400">{user?.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Timezone</label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="input"
                  >
                    <option value="Asia/Jerusalem">Israel (Asia/Jerusalem)</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSave} className="btn btn-primary mt-6">
                {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Webhook className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">n8n Integration</h3>
                    <p className="text-sm text-dark-400">Connect your n8n workflows</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">n8n Base Webhook URL</label>
                    <input
                      type="url"
                      value={integrations.n8nWebhook}
                      onChange={(e) => setIntegrations({ ...integrations, n8nWebhook: e.target.value })}
                      className="input"
                      placeholder="https://your-n8n-instance.com/webhook/"
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.684 15.932l-1.58.914c-.534.308-1.198-.077-1.198-.693v-1.83H9.09c-1.198 0-2.168-.97-2.168-2.168V9.845c0-1.198.97-2.168 2.168-2.168h4.82c1.198 0 2.168.97 2.168 2.168v3.31c0 1.198-.97 2.168-2.168 2.168h-.226v.609z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Shopify Integration</h3>
                    <p className="text-sm text-dark-400">Connect your Shopify store</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Store URL</label>
                    <input
                      type="text"
                      value={integrations.shopifyStore}
                      onChange={(e) => setIntegrations({ ...integrations, shopifyStore: e.target.value })}
                      className="input"
                      placeholder="your-store.myshopify.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">API Key</label>
                    <input
                      type="password"
                      value={integrations.shopifyApiKey}
                      onChange={(e) => setIntegrations({ ...integrations, shopifyApiKey: e.target.value })}
                      className="input"
                      placeholder="shpat_xxxxx"
                    />
                  </div>
                </div>

                <button className="btn btn-secondary mt-4">
                  <ExternalLink className="w-4 h-4" />
                  Connect Shopify
                </button>
              </div>

              <button onClick={handleSave} className="btn btn-primary">
                {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg bg-dark-800 cursor-pointer hover:bg-dark-750 transition-colors">
                  <div>
                    <p className="font-medium text-white">Product Updates</p>
                    <p className="text-sm text-dark-400">Get notified when product status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.productUpdates}
                    onChange={(e) => setNotifications({ ...notifications, productUpdates: e.target.checked })}
                    className="w-5 h-5 rounded bg-dark-600 border-dark-500 text-primary-500 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg bg-dark-800 cursor-pointer hover:bg-dark-750 transition-colors">
                  <div>
                    <p className="font-medium text-white">Automation Runs</p>
                    <p className="text-sm text-dark-400">Get notified when automations complete</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.automationRuns}
                    onChange={(e) => setNotifications({ ...notifications, automationRuns: e.target.checked })}
                    className="w-5 h-5 rounded bg-dark-600 border-dark-500 text-primary-500 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg bg-dark-800 cursor-pointer hover:bg-dark-750 transition-colors">
                  <div>
                    <p className="font-medium text-white">Daily Digest</p>
                    <p className="text-sm text-dark-400">Receive a daily summary email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.dailyDigest}
                    onChange={(e) => setNotifications({ ...notifications, dailyDigest: e.target.checked })}
                    className="w-5 h-5 rounded bg-dark-600 border-dark-500 text-primary-500 focus:ring-primary-500"
                  />
                </label>
              </div>

              <button onClick={handleSave} className="btn btn-primary mt-6">
                {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-6">Appearance</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-4 rounded-lg bg-dark-800 border-2 border-primary-500 text-center">
                      <div className="w-8 h-8 rounded-full bg-dark-900 mx-auto mb-2" />
                      <span className="text-sm text-white">Dark</span>
                    </button>
                    <button className="p-4 rounded-lg bg-dark-800 border-2 border-dark-600 text-center opacity-50 cursor-not-allowed">
                      <div className="w-8 h-8 rounded-full bg-white mx-auto mb-2" />
                      <span className="text-sm text-dark-400">Light</span>
                      <span className="text-xs text-dark-500 block">Soon</span>
                    </button>
                    <button className="p-4 rounded-lg bg-dark-800 border-2 border-dark-600 text-center opacity-50 cursor-not-allowed">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-b from-white to-dark-900 mx-auto mb-2" />
                      <span className="text-sm text-dark-400">Auto</span>
                      <span className="text-xs text-dark-500 block">Soon</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-3">Accent Color</label>
                  <div className="flex gap-3">
                    {[
                      { name: 'Pink', color: 'bg-pink-500' },
                      { name: 'Blue', color: 'bg-blue-500' },
                      { name: 'Green', color: 'bg-green-500' },
                      { name: 'Orange', color: 'bg-orange-500' },
                      { name: 'Purple', color: 'bg-purple-500' },
                    ].map((c) => (
                      <button
                        key={c.name}
                        className={`w-10 h-10 rounded-full ${c.color} ${c.name === 'Pink' ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-900' : ''}`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-6">Security</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-white mb-2">Change Password</h3>
                  <p className="text-sm text-dark-400 mb-4">Update your account password</p>
                  
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="input"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="input"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="input"
                    />
                  </div>

                  <button className="btn btn-secondary mt-4">
                    <Key className="w-4 h-4" />
                    Update Password
                  </button>
                </div>

                <div className="pt-6 border-t border-dark-700">
                  <h3 className="font-medium text-white mb-2">Sessions</h3>
                  <p className="text-sm text-dark-400 mb-4">Manage your active sessions</p>
                  
                  <div className="bg-dark-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Current Session</p>
                        <p className="text-sm text-dark-400">Chrome on Mac • Last active now</p>
                      </div>
                      <span className="badge bg-green-500/10 text-green-400">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
