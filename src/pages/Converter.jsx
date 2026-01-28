import { useState, useRef } from 'react'
import {
  FileCode,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react'

export default function Converter() {
  const [inputHtml, setInputHtml] = useState('')
  const [outputHtml, setOutputHtml] = useState('')
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [copied, setCopied] = useState(false)
  const [converting, setConverting] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.match(/\.(html|htm)$/i)) {
      setStatus({ type: 'error', message: 'Please upload an HTML file' })
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      setInputHtml(e.target.result)
      setStatus({ type: 'success', message: 'File loaded successfully!' })
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const input = fileInputRef.current
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input.files = dataTransfer.files
      handleFileUpload({ target: input })
    }
  }

  const convertToGemPages = () => {
    if (!inputHtml.trim()) {
      setStatus({ type: 'error', message: 'Please upload or paste HTML first' })
      return
    }

    setConverting(true)
    setStatus(null)

    // Simulate processing time
    setTimeout(() => {
      try {
        const converted = performConversion(inputHtml)
        setOutputHtml(converted)
        setStatus({ type: 'success', message: 'Conversion complete! Copy or download your GemPages-ready HTML.' })
      } catch (err) {
        setStatus({ type: 'error', message: 'Conversion failed: ' + err.message })
      }
      setConverting(false)
    }, 500)
  }

  const performConversion = (html) => {
    // Extract body content if full HTML document
    let content = html
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    if (bodyMatch) {
      content = bodyMatch[1]
    }

    // Extract existing styles
    let styles = ''
    const styleMatches = html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)
    for (const match of styleMatches) {
      styles += match[1] + '\n'
    }

    // Remove style tags from content
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

    // Prefix CSS
    const prefixedStyles = prefixCSS(styles)

    // Prefix HTML classes
    const prefixedContent = prefixHTML(content)

    // Build output
    return `<!-- GemPages-Ready Advertorial - Paste into Custom HTML Element -->
<style>
.gp-adv-wrap {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.7;
  color: #1f2937;
  background: #FFFFFF;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.gp-adv-wrap *, .gp-adv-wrap *::before, .gp-adv-wrap *::after {
  box-sizing: border-box;
}

.gp-adv-wrap img {
  max-width: 100%;
  height: auto;
}

.gp-adv-wrap a {
  color: inherit;
}

${prefixedStyles}
</style>

<div class="gp-adv-wrap">
${prefixedContent}
</div>`
  }

  const prefixCSS = (css) => {
    // Remove :root and body selectors
    css = css.replace(/:root\s*\{([^}]*)\}/g, '.gp-adv-wrap {$1}')
    css = css.replace(/body\s*\{([^}]*)\}/g, '')

    // Handle CSS custom properties
    css = css.replace(/--([a-zA-Z0-9-]+)\s*:/g, '--gp-$1:')
    css = css.replace(/var\(--([a-zA-Z0-9-]+)\)/g, 'var(--gp-$1)')

    // Prefix all class selectors
    css = css.replace(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g, '.gp-$1')

    // Fix double-prefixed
    css = css.replace(/\.gp-gp-/g, '.gp-')

    // Scope selectors
    const lines = css.split('\n')
    const scopedLines = lines.map(line => {
      if (line.match(/^\s*\.gp-[a-zA-Z]/)) {
        return line.replace(/^\s*(\.gp-[^{]+)/, '.gp-adv-wrap $1')
      }
      return line
    })

    return scopedLines.join('\n')
  }

  const prefixHTML = (html) => {
    // Prefix all class names
    html = html.replace(/class="([^"]*)"/g, (match, classes) => {
      const prefixed = classes
        .split(/\s+/)
        .map(c => c ? 'gp-' + c : '')
        .join(' ')
      return `class="${prefixed}"`
    })

    // Fix double-prefixed
    html = html.replace(/gp-gp-/g, 'gp-')

    return html
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(outputHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadFile = () => {
    const blob = new Blob([outputHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gempages-advertorial.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    setInputHtml('')
    setOutputHtml('')
    setFileName('')
    setStatus(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">GemPages Converter</h1>
        <p className="text-dark-400 mt-1">
          Convert your HTML advertorials to GemPages-ready format
        </p>
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          status.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {status.message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Input HTML</h2>
            <button onClick={clearAll} className="btn btn-ghost text-sm py-1.5">
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>

          {/* Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 transition-colors mb-4"
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-dark-400" />
            <p className="text-dark-300 mb-1">
              <span className="text-primary-400 font-medium">Click to upload</span> or drag & drop
            </p>
            <p className="text-sm text-dark-500">HTML files only</p>
            {fileName && (
              <p className="mt-3 text-primary-400 font-medium">✅ {fileName}</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="text-center text-dark-500 text-sm my-4">— OR —</div>

          <textarea
            value={inputHtml}
            onChange={(e) => setInputHtml(e.target.value)}
            placeholder="Paste your HTML code here..."
            className="input font-mono text-sm min-h-[200px]"
          />

          <button
            onClick={convertToGemPages}
            disabled={converting || !inputHtml.trim()}
            className="w-full btn btn-primary mt-4"
          >
            {converting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <FileCode className="w-5 h-5" />
                Convert to GemPages
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">GemPages-Ready Output</h2>
            {outputHtml && (
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="btn btn-secondary text-sm py-1.5">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadFile} className="btn btn-secondary text-sm py-1.5">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            )}
          </div>

          {outputHtml ? (
            <textarea
              value={outputHtml}
              readOnly
              className="input font-mono text-sm min-h-[400px] bg-dark-800 text-dark-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-dark-500">
              <FileCode className="w-16 h-16 mb-4 opacity-50" />
              <p>Converted HTML will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="card bg-dark-800/50">
        <h3 className="font-semibold text-white mb-3">What this converter does:</h3>
        <ul className="space-y-2 text-sm text-dark-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Scopes all CSS classes with <code className="text-primary-400">gp-</code> prefix to prevent conflicts</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Wraps content in a container for clean isolation in GemPages</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Preserves responsive styles and mobile compatibility</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Makes the output ready to paste into GemPages Custom HTML element</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
