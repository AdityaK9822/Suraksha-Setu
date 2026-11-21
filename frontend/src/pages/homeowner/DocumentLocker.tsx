import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Download, RefreshCw, History, Upload, ShieldCheck } from 'lucide-react'
import api from '../../services/api'
import type { DocumentRecord } from '../../types'

export default function DocumentLocker() {
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [filter, setFilter] = useState('ALL')
  const [versionModalDoc, setVersionModalDoc] = useState<DocumentRecord | null>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const load = () => {
    api
      .get('/homeowner/documents')
      .then(r => setDocs(r.data.documents || []))
      .catch(() => {})
  }

  useEffect(load, [])

  const filtered = filter === 'ALL' ? docs : docs.filter(d => d.category === filter)

  const preview = async (id: string) => {
    try {
      const r = await api.get(`/homeowner/documents/${id}/preview`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      window.open(url, '_blank')
    } catch {
      setErr('Unable to preview document.')
    }
  }

  const download = async (id: string, name: string) => {
    try {
      const r = await api.get(`/homeowner/documents/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
    } catch {
      setErr('Unable to download document.')
    }
  }

  const triggerReplace = (docId: string) => {
    setReplacingId(docId)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleReplaceFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacingId) return
    setMsg('')
    setErr('')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await api.put(`/homeowner/documents/${replacingId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMsg(
        `Uploaded new version (v${r.data.document.version}) for ${
          r.data.document.subcategory || r.data.document.originalName
        }.`
      )
      setReplacingId(null)
      load()
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Could not replace document')
    }
  }

  const importDigiLockerDemo = async (docType: string) => {
    setMsg('')
    setErr('')
    try {
      await api.post('/homeowner/documents/digilocker-demo', { docType })
      setMsg(`Imported "${docType}" via Simulated DigiLocker Consent Flow (Demo Mode).`)
      load()
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Simulated import failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">Digital Document Locker</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Private, versioned repository for your Property and Loan records. Files are never exposed via public URLs.
          </p>
        </div>
        <Link to="/homeowner/upload" className="btn btn-primary text-xs sm:text-sm">
          <Upload size={16} /> Upload New Document
        </Link>
      </div>

      {/* Hidden File Input for Replacing Versions */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {msg}
        </div>
      )}
      {err && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{err}</div>
      )}

      {/* Filter Tabs & Optional Simulated DigiLocker Pull */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(
            [
              ['ALL', `All Records (${docs.length})`],
              ['PROPERTY', `Property Documents (${docs.filter(d => d.category === 'PROPERTY').length})`],
              ['LOAN', `Loan Documents (${docs.filter(d => d.category === 'LOAN').length})`],
            ] as const
          ).map(([code, label]) => (
            <button
              key={code}
              className={`btn text-xs ${filter === code ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(code)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => importDigiLockerDemo('Index II Record')}
            className="btn bg-white border border-bhuid-gold text-bhuid-charcoal hover:bg-bhuid-ivory text-xs"
          >
            <ShieldCheck size={15} className="text-bhuid-forest" />
            <span>Pull Index II via DigiLocker (Simulated Demo)</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Document ID</th>
              <th>Category &amp; Type</th>
              <th>Filename</th>
              <th>Status</th>
              <th>Version</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td className="font-mono text-xs font-semibold text-bhuid-forest">{d.documentId}</td>
                <td>
                  <span className={`badge ${d.category === 'PROPERTY' ? 'badge-green' : 'badge-gold'} mr-2`}>
                    {d.category}
                  </span>
                  <span className="font-medium text-bhuid-charcoal">{d.subcategory || 'General'}</span>
                </td>
                <td className="text-xs text-neutral-600">{d.originalName}</td>
                <td>
                  <span className="badge badge-blue">{d.status}</span>
                </td>
                <td>
                  <span className="font-mono text-xs font-semibold">v{d.version}</span>
                </td>
                <td className="text-xs text-neutral-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      className="text-bhuid-forest font-semibold hover:underline inline-flex items-center gap-1"
                      onClick={() => preview(d.id)}
                    >
                      <Eye size={13} /> Preview
                    </button>
                    <button
                      type="button"
                      className="text-bhuid-forest font-semibold hover:underline inline-flex items-center gap-1"
                      onClick={() => download(d.id, d.originalName)}
                    >
                      <Download size={13} /> Download
                    </button>
                    <button
                      type="button"
                      className="text-amber-700 font-semibold hover:underline inline-flex items-center gap-1"
                      onClick={() => triggerReplace(d.id)}
                    >
                      <RefreshCw size={13} /> Replace
                    </button>
                    <button
                      type="button"
                      className="text-neutral-500 font-semibold hover:underline inline-flex items-center gap-1"
                      onClick={() => setVersionModalDoc(d)}
                    >
                      <History size={13} /> History ({d.versions?.length || 1})
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-neutral-400 py-8">
                  No documents in this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-neutral-500 italic">
        Note: Document upload and storage within the Suraksha Setu Document Locker is for secure record-keeping and
        consent-driven sharing; it does not constitute government title verification.
      </div>

      {/* Version History Modal */}
      {versionModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-bhuid-forest font-bold">
                  Version History · {versionModalDoc.documentId}
                </div>
                <h3 className="font-heading text-lg font-bold text-bhuid-green">
                  {versionModalDoc.subcategory || versionModalDoc.originalName}
                </h3>
              </div>
              <button onClick={() => setVersionModalDoc(null)} className="text-sm text-neutral-500">
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(versionModalDoc.versions || []).map(v => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg bg-bhuid-ivory/60 border border-neutral-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-bhuid-green">Version {v.version}</span>
                    <div className="text-neutral-600 mt-0.5">{v.originalName}</div>
                  </div>
                  <div className="text-right text-neutral-500">
                    <div>{(v.size / 1024).toFixed(1)} KB</div>
                    <div>{new Date(v.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setVersionModalDoc(null)} className="btn btn-primary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
