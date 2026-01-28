import { useState, useRef } from 'react'
import { convertHTMLToGemPages } from '../utils/gempagesConverter'
import {
  FileCode,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  FileJson
} from 'lucide-react'

export default function Converter() {
  const [inputHtml, setInputHtml] = useState('')
  const [outputJson, setOutputJson] = useState('')
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState(null)
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

    setTimeout(() => {
      try {
        const gemPagesData = convertHTMLToGemPages(inputHtml)
        const jsonString = JSON.stringify(gemPagesData, null, 2)
        setOutputJson(jsonString)
        setStatus({ type: 'success', message: 'Conversion complete! Download the JSON file and import it into GemPages.' })
      } catch (err) {
        console.error('Conversion error:', err)
        setStatus({ type: 'error', message: 'Conversion failed: ' + err.message })
      }
      setConverting(false)
    }, 500)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(outputJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadFile = () => {
    const blob = new Blob([outputJson], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'advertorial.gempages'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    setInputHtml('')
    setOutputJson('')
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
          Convert HTML advertorials to GemPages native format (JSON import)
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
                <FileJson className="w-5 h-5" />
                Convert to GemPages JSON
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">GemPages Import File</h2>
            {outputJson && (
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="btn btn-secondary text-sm py-1.5">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadFile} className="btn btn-primary text-sm py-1.5">
                  <Download className="w-4 h-4" />
                  Download .gempages
                </button>
              </div>
            )}
          </div>

          {outputJson ? (
            <textarea
              value={outputJson}
              readOnly
              className="input font-mono text-sm min-h-[400px] bg-dark-800 text-dark-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-dark-500">
              <FileJson className="w-16 h-16 mb-4 opacity-50" />
              <p>GemPages JSON will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-dark-800/50">
        <h3 className="font-semibold text-white mb-3">How to import into GemPages:</h3>
        <ol className="space-y-3 text-sm text-dark-300 list-decimal list-inside">
          <li>Click <strong className="text-white">"Download .gempages"</strong> above after conversion</li>
          <li>Open <strong className="text-white">GemPages Editor</strong> in your Shopify store</li>
          <li>Create a new page or open an existing one</li>
          <li>Click the <strong className="text-white">⚙️ Settings icon</strong> (top right)</li>
          <li>Select <strong className="text-white">"Import"</strong> → <strong className="text-white">"From file"</strong></li>
          <li>Upload the downloaded <code className="text-primary-400">.gempages</code> file</li>
          <li>Done! Your advertorial is now a native GemPages page 🎉</li>
        </ol>
      </div>

      {/* Features */}
      <div className="card bg-dark-800/50">
        <h3 className="font-semibold text-white mb-3">What this converter does:</h3>
        <ul className="space-y-2 text-sm text-dark-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Converts to <strong className="text-white">native GemPages components</strong> (not Custom HTML)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Creates <strong className="text-white">working countdown timers</strong> (evergreen, auto-loops)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Preserves <strong className="text-white">sticky headers</strong> with proper positioning</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Maintains <strong className="text-white">responsive styling</strong> for desktop, tablet & mobile</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Fully <strong className="text-white">editable</strong> in GemPages after import</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
