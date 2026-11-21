import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileCheck2, AlertCircle } from 'lucide-react'
import api from '../../services/api'

const PROPERTY_CATS = [
  'Sale deed',
  'Agreement for sale',
  'Registration documents',
  'Index II',
  'Property tax receipts',
  'Society share certificate',
  'Maintenance receipts',
  'Other property records',
]

const LOAN_CATS = [
  'Loan sanction letter',
  'Loan statements',
  'Repayment-related records',
  'No-objection certificate',
  'Other loan documents',
]

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024

export default function UploadDocuments() {
  const [category, setCategory] = useState('PROPERTY')
  const [subcategory, setSubcategory] = useState('Sale deed')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const navigate = useNavigate()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErr('')
    const f = e.target.files?.[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      setErr('Invalid file type. Only PDF, JPG, JPEG, and PNG files are permitted.')
      e.target.value = ''
      return
    }
    if (f.size > MAX_BYTES) {
      setErr('File exceeds maximum allowed size of 10 MB.')
      e.target.value = ''
      return
    }
    setFile(f)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    if (!file) {
      setErr('Please choose a valid PDF, JPG, or PNG file to upload.')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', category)
    fd.append('subcategory', subcategory)
    try {
      const r = await api.post('/homeowner/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => {
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100))
        },
      })
      setMsg(`Uploaded "${r.data.document.subcategory}" (Document ID: ${r.data.document.documentId}).`)
      setFile(null)
      setProgress(0)
      setTimeout(() => navigate('/homeowner/documents'), 1100)
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Upload failed')
      setProgress(0)
    }
  }

  const subs = category === 'PROPERTY' ? PROPERTY_CATS : LOAN_CATS

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Upload Property &amp; Loan Documents</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Store validated PDF, JPG, or PNG documents in your private Suraksha Setu locker.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <FileCheck2 size={18} /> <span>{msg}</span>
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} /> <span>{err}</span>
        </div>
      )}

      <form onSubmit={submit} className="card p-7 space-y-5 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Primary Classification *</label>
            <select
              className="input"
              value={category}
              onChange={e => {
                const next = e.target.value
                setCategory(next)
                setSubcategory(next === 'PROPERTY' ? PROPERTY_CATS[0] : LOAN_CATS[0])
              }}
            >
              <option value="PROPERTY">Property Documents</option>
              <option value="LOAN">Loan Documents</option>
            </select>
          </div>

          <div>
            <label className="label">Document Category *</label>
            <select
              className="input"
              value={subcategory}
              onChange={e => setSubcategory(e.target.value)}
              required
            >
              {subs.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 rounded-xl border-2 border-dashed border-bhuid-forest/40 bg-bhuid-ivory/50 text-center space-y-3">
          <Upload size={28} className="mx-auto text-bhuid-forest" />
          <div className="text-sm font-semibold text-bhuid-green">
            Select Document File (PDF, JPG, JPEG, PNG · Max 10 MB)
          </div>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="block w-full text-xs text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-bhuid-green file:text-bhuid-ivory hover:file:bg-bhuid-forest cursor-pointer"
          />
          {file && (
            <div className="text-xs text-bhuid-forest font-medium">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Encrypting &amp; uploading to private vault...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div className="bg-bhuid-forest h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button className="btn btn-primary px-7 py-3" type="submit">
          Upload to Private Locker
        </button>
      </form>
    </div>
  )
}
