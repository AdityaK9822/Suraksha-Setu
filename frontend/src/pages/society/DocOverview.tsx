import { useState, useEffect } from 'react'
import api from '../../services/api'
import type { HomeownerRecord } from '../../types'

const DOC_STATUSES = [
  'Uploaded',
  'Pending Review',
  'Under Review',
  'Accepted for stated purpose',
  'Rejected',
  'Expired',
]

export default function DocOverview() {
  const [list, setList] = useState<HomeownerRecord[]>([])
  const [msg, setMsg] = useState('')

  const load = () => {
    api
      .get('/society-admin/me')
      .then(r => api.get(`/societies/${r.data.society.id}/directory`))
      .then(r => setList(r.data.homeowners || []))
      .catch(() => {})
  }

  useEffect(load, [])

  const updateStatus = async (docId: string, status: string) => {
    try {
      await api.put(`/homeowner/documents/${docId}/status`, { status })
      setMsg(`Document metadata status updated to "${status}".`)
      load()
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Could not update status')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Document Submission Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review resident document submission metadata and update verification status without accessing private file
          contents without consent.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {msg}
        </div>
      )}

      <div className="space-y-4">
        {list.map(h => {
          const f = h.flats?.[0]?.flat
          return (
            <div key={h.id} className="card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div>
                  <div className="font-heading text-lg font-bold text-bhuid-green">
                    {h.name} · Flat {f?.wing ? `${f.wing}-` : ''}
                    {f?.flatNumber}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Property ID: <span className="font-mono">{f?.property?.propertyId || '—'}</span> · Total Submitted:{' '}
                    {h.documentCount}
                  </div>
                </div>
                <span className="badge badge-gold">
                  {h.propertyDocCount || 0} Property · {h.loanDocCount || 0} Loan
                </span>
              </div>

              {h.documents && h.documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Document ID</th>
                        <th>Category</th>
                        <th>Type / Subcategory</th>
                        <th>Version</th>
                        <th>Current Status</th>
                        <th>Update Review Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.documents.map(d => (
                        <tr key={d.id}>
                          <td className="font-mono text-xs text-bhuid-forest">{d.documentId}</td>
                          <td>
                            <span className="badge badge-gray">{d.category}</span>
                          </td>
                          <td className="font-medium">{d.subcategory || d.originalName}</td>
                          <td>v{d.version}</td>
                          <td>
                            <span className="badge badge-blue">{d.status}</span>
                          </td>
                          <td>
                            <select
                              className="input py-1.5 text-xs w-52"
                              value={d.status}
                              onChange={e => updateStatus(d.id, e.target.value)}
                            >
                              {DOC_STATUSES.map(st => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 italic">No documents uploaded by this homeowner yet.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
