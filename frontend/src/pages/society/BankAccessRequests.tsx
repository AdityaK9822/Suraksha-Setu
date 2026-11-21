import { useState, useEffect } from 'react'
import { KeyRound, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import api from '../../services/api'
import type { OfficeBearer, AccessRequest } from '../../types'

export default function BankAccessRequests() {
  const [bearers, setBearers] = useState<OfficeBearer[]>([])
  const [selectedBearer, setSelectedBearer] = useState('')
  const [list, setList] = useState<AccessRequest[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')

  const load = () => {
    api
      .get('/society-admin/me')
      .then(r => {
        const obs: OfficeBearer[] = r.data.society?.officeBearers || []
        setBearers(obs)
        if (obs.length > 0 && !selectedBearer) setSelectedBearer(obs[0].id)
        return api.get(`/societies/${r.data.society.id}/requests`)
      })
      .then(r => setList(r.data.requests || []))
      .catch(() => {})
  }

  useEffect(load, [])

  const act = async (id: string, action: string) => {
    setMsg('')
    try {
      const note = notes[id] || ''
      await api.post(`/requests/${id}/${action}`, {
        note,
        officeBearerId: selectedBearer || undefined,
      })
      setMsg(`Request updated (${action.replace('society-', '').toUpperCase()}).`)
      load()
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Could not process decision')
    }
  }

  const parseJsonList = (str?: string): string[] => {
    try {
      const arr = JSON.parse(str || '[]')
      return Array.isArray(arr) ? arr : [str || '']
    } catch {
      return str ? [str] : []
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-bhuid-forest bg-bhuid-green/10 px-3 py-1 rounded-full mb-2">
            <KeyRound size={14} />
            <span>Stage 2 · Key-1 Society Authorisation</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">Bank Access Requests</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Review incoming bank verification requests. Society approval authorises Key 1; private documents remain
            locked until the Homeowner grants Key 2 consent.
          </p>
        </div>

        {/* Select Authorised Representative Acting on Request */}
        {bearers.length > 0 && (
          <div className="card p-3.5 bg-white flex items-center gap-3">
            <div className="text-xs">
              <div className="text-neutral-400 font-semibold uppercase text-[10px]">Acting Representative</div>
              <select
                className="input py-1.5 text-xs font-semibold mt-0.5"
                value={selectedBearer}
                onChange={e => setSelectedBearer(e.target.value)}
              >
                {bearers.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {msg}
        </div>
      )}

      <div className="space-y-4">
        {list.map(r => {
          const flat = r.homeowner?.flats?.[0]?.flat
          const infoList = parseJsonList(r.requestedInfo)
          const docList = parseJsonList(r.requestedDocs)
          return (
            <div key={r.id} className="card p-6 space-y-4">
              <div className="flex flex-wrap justify-between items-start gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
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
                  <h3 className="font-heading text-xl font-bold text-bhuid-green mt-1">
                    {r.bank?.name} {r.bank?.branch ? `(${r.bank.branch})` : ''}
                  </h3>
                  <div className="text-sm text-neutral-600 mt-0.5">
                    Homeowner: <strong>{r.homeowner?.name}</strong> · Flat{' '}
                    <strong>{flat ? `${flat.wing ? flat.wing + '-' : ''}${flat.flatNumber}` : 'N/A'}</strong>
                  </div>
                </div>

                <div className="text-right text-xs text-neutral-500 space-y-1">
                  <div>Requested: {new Date(r.createdAt).toLocaleDateString()}</div>
                  <div>Expires: {new Date(r.expiryDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-bhuid-ivory/60">
                  <div className="text-neutral-500 font-semibold mb-1">Stated Purpose</div>
                  <div className="font-semibold text-bhuid-charcoal text-sm">{r.purpose}</div>
                  {r.explanation && <div className="text-neutral-500 mt-1">{r.explanation}</div>}
                </div>
                <div className="p-3.5 rounded-xl bg-bhuid-ivory/60">
                  <div className="text-neutral-500 font-semibold mb-1.5">Requested Information Fields</div>
                  <div className="flex flex-wrap gap-1.5">
                    {infoList.map(i => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white border border-neutral-200 font-medium">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-bhuid-ivory/60">
                  <div className="text-neutral-500 font-semibold mb-1.5">Requested Document Categories</div>
                  <div className="flex flex-wrap gap-1.5">
                    {docList.map(d => (
                      <span key={d} className="px-2 py-0.5 rounded bg-white border border-neutral-200 font-medium">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {r.societyApproval && (
                <div className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <strong>Society Decision:</strong> {r.societyApproval.decision} — {r.societyApproval.note}
                </div>
              )}

              {(r.status === 'SUBMITTED' || r.status === 'CLARIFICATION_REQUIRED') && (
                <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                  <input
                    className="input max-w-md text-xs py-2"
                    placeholder="Optional note or clarification remark from office bearer..."
                    value={notes[r.id] || ''}
                    onChange={e => setNotes({ ...notes, [r.id]: e.target.value })}
                  />
                  <div className="flex gap-2.5 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-primary text-xs"
                      onClick={() => act(r.id, 'society-approve')}
                    >
                      <CheckCircle2 size={15} /> Approve (Turn Key 1)
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline text-xs"
                      onClick={() => act(r.id, 'society-clarify')}
                    >
                      <HelpCircle size={15} /> Request Clarification
                    </button>
                    <button
                      type="button"
                      className="btn bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs"
                      onClick={() => act(r.id, 'society-reject')}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {list.length === 0 && (
          <div className="card p-10 text-center text-neutral-400 text-sm">
            No bank access requests submitted for your society yet.
          </div>
        )}
      </div>
    </div>
  )
}
