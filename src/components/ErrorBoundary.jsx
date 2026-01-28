import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * Error Boundary - Catches JavaScript errors anywhere in the child component tree
 * Shows a friendly error message instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Log error to console (could also send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            {/* Error Message */}
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-dark-400 mb-6">
              Don't worry, your data is safe. Try refreshing the page or going back to the dashboard.
            </p>
            
            {/* Error Details (collapsible) */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-dark-500 cursor-pointer hover:text-dark-400">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-dark-900 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRefresh}
                className="btn btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
