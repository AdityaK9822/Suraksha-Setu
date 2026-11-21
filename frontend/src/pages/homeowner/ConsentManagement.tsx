import { useState, useEffect } from 'react'
import { Lock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import type { AccessRequest, DocumentRecord } from '../../types'

export default function ConsentManagement() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  // IMPORTANT: Consent must NEVER be preselected. Maps requestId -> array of selected document IDs
  const [selectedDocsMap, setSelectedDocsMap] = useState<Record<string, string[]>>({})
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = () => {
    Promise.all([api.get('/homeowner/requests'), api.get('/homeowner/documents')])
      .then(([reqRes, docRes]) => {
        setRequests(reqRes.data.requests || [])
        setDocuments(docRes.data.documents || [])
      })
      .catch(() => {})
  }

  useEffect(load, [])

  const toggleDocSelection = (reqId: string, docId: string) => {
    setSelectedDocsMap(prev => {
      const curr = prev[reqId] || []
      const next = curr.includes(docId) ? curr.filter(x => x !== docId) : [...curr, docId]
      return { ...prev, [reqId]: next }
    })
  }

  const submitConsent = async (reqId: string, decision: 'CONSENT_GRANTED' | 'CONSENT_REJECTED') => {
    setMsg('')
    setErr('')
    const chosenDocs = selectedDocsMap[reqId] || []
    if (decision === 'CONSENT_GRANTED' && chosenDocs.length === 0) {
      setErr('Consent is never preselected. Please explicitly check at least one document from your locker to share.')
      return
    }
    try {
      const r = await api.post(`/homeowner/requests/${reqId}/consent`, {
        decision,
        note: notesMap[reqId] || '',
        authorisedDocs: chosenDocs,
      })
      if (decision === 'CONSENT_GRANTED') {
        setMsg(`Key-2 Consent Granted! Controlled Access Grant (${r.data.grant?.grantId}) has been issued to the bank.`)
      } else {
        setMsg('Consent declined. No documents were disclosed to the bank.')
      }
      load()
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Could not process consent decision')
    }
  }

  const parseList = (s?: string): string[] => {
    try {
      const a = JSON.parse(s || '[]')
      return Array.isArray(a) ? a : [s || '']
    } catch {
      return s ? [s] : []
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-bhuid-forest bg-bhuid-green/10 px-3 py-1 rounded-full mb-2">
          <Lock size={14} />
          <span>Stage 3 · Key-2 Homeowner Granular Consent</span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Consent Management</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Consent is never preselected. Review society-authorised bank requests and explicitly check the exact documents
          from your locker that you authorise for time-limited sharing.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {msg}
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{err}</div>
      )}

      <div className="space-y-5">
        {requests.map(r => {
          const reqInfo = parseList(r.requestedInfo)
          const reqDocs = parseList(r.requestedDocs)
          const selectedForReq = selectedDocsMap[r.id] || []
          const canConsent = r.status === 'SOCIETY_APPROVED'

          return (
            <div key={r.id} className="card p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-bhuid-forest">{r.requestId}</span>
                    <span
                      className={`badge ${
                        r.status === 'ACCESS_GRANTED'
                          ? 'badge-green'
                          : r.status === 'SOCIETY_APPROVED'
                          ? 'badge-gold'
                          : r.status.includes('REJECTED')
                          ? 'badge-red'
                          : 'badge-blue'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-bhuid-green mt-1">{r.bank?.name}</h3>
                  <div className="text-sm text-neutral-600">
                    Purpose: <strong>{r.purpose}</strong>
                  </div>
                </div>

                <div className="text-right text-xs text-neutral-500">
                  <div>
                    Key 1 (Society): <strong>{r.societyApproval?.decision || 'PENDING'}</strong>
                  </div>
                  <div>
                    Key 2 (Your Consent): <strong>{r.homeownerConsent?.decision || 'PENDING'}</strong>
                  </div>
                  <div>Grant Expiry: {new Date(r.expiryDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-bhuid-ivory/60">
                  <div className="font-semibold text-neutral-600 mb-1.5">Bank Requested Information Fields:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {reqInfo.map(i => (
                      <span key={i} className="px-2.5 py-0.5 rounded bg-white border border-neutral-200 font-medium">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-bhuid-ivory/60">
                  <div className="font-semibold text-neutral-600 mb-1.5">Bank Requested Document Categories:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {reqDocs.map(d => (
                      <span key={d} className="px-2.5 py-0.5 rounded bg-white border border-neutral-200 font-medium">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {r.status === 'SUBMITTED' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>
                    Awaiting Key-1 Society Representative approval before you can grant Key-2 document disclosure.
                  </span>
                </div>
              )}

              {canConsent && (
                <div className="p-5 rounded-xl bg-bhuid-ivory/70 border border-bhuid-gold space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-bhuid-green">
                      Select Exact Documents From Your Locker to Share (None Preselected)
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Only the documents you check below will be accessible to {r.bank?.name} until{' '}
                      {new Date(r.expiryDate).toLocaleDateString()}.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {documents.map(doc => {
                      const checked = selectedForReq.includes(doc.id)
                      const isRequestedCat =
                        (doc.subcategory ? reqDocs.includes(doc.subcategory) : false) || reqDocs.includes(doc.category)
                      return (
                        <label
                          key={doc.id}
                          className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition ${
                            checked
                              ? 'bg-bhuid-green text-bhuid-ivory border-bhuid-green'
                              : 'bg-white text-bhuid-charcoal border-neutral-200 hover:border-bhuid-forest'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDocSelection(r.id, doc.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{doc.subcategory || doc.category}</div>
                            <div
                              className={`text-[11px] truncate ${checked ? 'text-bhuid-ivory/75' : 'text-neutral-500'}`}
                            >
                              {doc.originalName} · {doc.documentId}
                            </div>
                            {isRequestedCat && (
                              <span
                                className={`inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded ${
                                  checked ? 'bg-bhuid-gold text-bhuid-charcoal font-bold' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                Matches Bank Request
                              </span>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <input
                      className="input max-w-md text-xs py-2 bg-white"
                      placeholder="Optional consent note for audit log..."
                      value={notesMap[r.id] || ''}
                      onChange={e => setNotesMap({ ...notesMap, [r.id]: e.target.value })}
                    />
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        className="btn btn-primary text-xs"
                        onClick={() => submitConsent(r.id, 'CONSENT_GRANTED')}
                      >
                        <CheckCircle2 size={15} /> Grant Consent &amp; Issue Access ({selectedForReq.length} docs)
                      </button>
                      <button
                        type="button"
                        className="btn bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs"
                        onClick={() => submitConsent(r.id, 'CONSENT_REJECTED')}
                      >
                        <XCircle size={15} /> Reject Request
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {requests.length === 0 && (
          <div className="card p-10 text-center text-neutral-400 text-sm">No bank requests awaiting consent.</div>
        )}
      </div>
    </div>
  )
}
