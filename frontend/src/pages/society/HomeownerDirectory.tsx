import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import api from '../../services/api'
import type { Society, HomeownerRecord } from '../../types'

export default function HomeownerDirectory() {
  const [society, setSociety] = useState<Society | null>(null)
  const [list, setList] = useState<HomeownerRecord[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    api
      .get('/society-admin/me')
      .then(r => {
        setSociety(r.data.society)
        return api.get(`/societies/${r.data.society.id}/directory`)
      })
      .then(r => setList(r.data.homeowners || []))
      .catch(() => {})
  }, [])

  const filtered = list.filter(
    h =>
      (h.name || '').toLowerCase().includes(q.toLowerCase()) ||
      (h.flats?.[0]?.flat?.flatNumber || '').toLowerCase().includes(q.toLowerCase()) ||
      (h.flats?.[0]?.flat?.wing || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">Homeowner Directory</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {society?.name} · Complete resident registry and document submission status.
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-neutral-400" />
          <input
            className="input pl-10 w-72"
            placeholder="Search homeowner, flat, or wing..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Homeowner Name</th>
              <th>Flat Number</th>
              <th>Building / Wing</th>
              <th>Ownership Category</th>
              <th>Account Status</th>
              <th>Document Submission Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(h => {
              const f = h.flats?.[0]?.flat
              return (
                <tr key={h.id}>
                  <td>
                    <div className="font-semibold text-bhuid-green">{h.name}</div>
                    <div className="text-xs text-neutral-500">{h.email}</div>
                  </td>
                  <td className="font-mono font-semibold">{f?.flatNumber || '—'}</td>
                  <td>{f?.wing ? `Wing ${f.wing}` : 'Main'}</td>
                  <td className="text-xs">{h.ownershipCategory || 'Owner'}</td>
                  <td>
                    <span className={`badge ${h.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{h.status}</span>
                  </td>
                  <td>
                    {(h.documentCount || 0) > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="badge badge-gold">{h.documentCount} Submitted</span>
                        <span className="text-xs text-neutral-500">
                          ({h.propertyDocCount || 0} Property · {h.loanDocCount || 0} Loan)
                        </span>
                      </div>
                    ) : (
                      <span className="badge badge-gray">Pending Submission</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-neutral-400 py-8">
                  No homeowners matched your search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
