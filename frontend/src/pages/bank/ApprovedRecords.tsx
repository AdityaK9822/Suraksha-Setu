import { useState, useEffect } from 'react'
import { Eye, Download, ShieldCheck, Clock } from 'lucide-react'
import api from '../../services/api'
import type { AccessGrant } from '../../types'

export default function ApprovedRecords() {
  const [list, setList] = useState<AccessGrant[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api
      .get('/bank/records')
      .then(r => setList(r.data.grants || []))
      .catch(() => {})
  }, [])

  const viewDoc = async (grantId: string, docId?: string) => {
    if (!docId) return
    setErr('')
    try {
      const r = await api.get(`/bank/documents/${grantId}/${docId}`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      window.open(url, '_blank')
    } catch {
      setErr('Access denied: This grant has expired, been revoked, or the document is not authorised.')
    }
  }

  const downloadDoc = async (grantId: string, docId?: string, filename?: string) => {
    if (!docId) return
    setErr('')
    try {
      const r = await api.get(`/bank/documents/${grantId}/${docId}?download=true`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'document'
      a.click()
    } catch {
      setErr('Download denied: This grant has expired or been revoked by the homeowner.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-bhuid-forest bg-bhuid-green/10 px-3 py-1 rounded-full mb-2">
          <ShieldCheck size={14} />
          <span>Stage 5 · Dual-Authorised Controlled Access</span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Approved Property Records</h1>
        <p className="text-sm text-neutral-500 mt-1">
          View and download only the specific information fields and documents authorised by both the Housing Society
          and the Homeowner. Every access event is logged.
        </p>
      </div>

      {err && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{err}</div>
      )}

      <div className="space-y-5">
        {list.map(g => {
          const dh = g.disclosedHomeowner || {}
          return (
            <div key={g.id} className="card p-6 space-y-5 border-l-4 border-l-bhuid-gold">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-bhuid-forest">{g.grantId}</span>
                    <span className="badge badge-green">TWO-KEY AUTHORISED</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-bhuid-green mt-1">
                    {dh.name || g.homeowner?.name}
                  </h3>
                  <div className="text-xs text-neutral-500">
                    Society: {g.homeowner?.society?.name} · Request Purpose: {g.accessRequest?.purpose}
                  </div>
                </div>

                <div className="text-right text-xs text-neutral-500 flex items-center gap-1.5">
                  <Clock size={14} className="text-bhuid-forest" />
                  <span>Valid until {new Date(g.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Disclosed Information Fields */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Authorised Disclosed Information Fields
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  {dh.propertyId && (
                    <div className="p-3 rounded-lg bg-bhuid-ivory/60">
                      <div className="text-neutral-500">Property ID</div>
                      <div className="font-mono font-bold text-bhuid-green mt-0.5">{dh.propertyId}</div>
                    </div>
                  )}
                  {dh.flatNumber && (
                    <div className="p-3 rounded-lg bg-bhuid-ivory/60">
                      <div className="text-neutral-500">Flat / Wing</div>
                      <div className="font-semibold mt-0.5">
                        {dh.wing ? `Wing ${dh.wing} · ` : ''}Flat {dh.flatNumber}
                      </div>
                    </div>
                  )}
                  {dh.email && (
                    <div className="p-3 rounded-lg bg-bhuid-ivory/60">
                      <div className="text-neutral-500">Verified Email</div>
                      <div className="font-semibold mt-0.5">{dh.email}</div>
                    </div>
                  )}
                  {dh.phone && (
                    <div className="p-3 rounded-lg bg-bhuid-ivory/60">
                      <div className="text-neutral-500">Contact Number</div>
                      <div className="font-semibold mt-0.5">{dh.phone}</div>
                    </div>
                  )}
                  {dh.address && (
                    <div className="p-3 rounded-lg bg-bhuid-ivory/60 sm:col-span-2">
                      <div className="text-neutral-500">Registered Society Address</div>
                      <div className="font-semibold mt-0.5">{dh.address}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Authorised Documents */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Authorised Documents ({g.documents?.length || 0})
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(g.documents || []).map(d => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl bg-white border border-neutral-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-bhuid-green truncate">
                          {d.document?.subcategory || d.document?.category}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate">
                          {d.document?.originalName} · {d.document?.documentId}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="btn btn-outline py-1.5 px-3 text-xs"
                          onClick={() => viewDoc(g.grantId, d.document?.id)}
                        >
                          <Eye size={13} /> Preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary py-1.5 px-3 text-xs"
                          onClick={() => downloadDoc(g.grantId, d.document?.id, d.document?.originalName)}
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {list.length === 0 && (
          <div className="card p-10 text-center text-neutral-400 text-sm">
            No active approved record grants yet. Once both the Society and Homeowner approve your request, records
            appear here.
          </div>
        )}
      </div>
    </div>
  )
}
