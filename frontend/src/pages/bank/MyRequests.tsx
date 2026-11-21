import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import type { AccessRequest } from '../../types'

export default function MyRequests() {
  const [list, setList] = useState<AccessRequest[]>([])
  useEffect(() => {
    api
      .get('/bank/requests')
      .then(r => setList(r.data.requests || []))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">My Access Requests</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Monitor real-time progression through Stage 2 (Society Approval) and Stage 3 (Homeowner Consent).
          </p>
        </div>
        <Link to="/bank/records" className="btn btn-primary text-xs">
          Open Approved Records →
        </Link>
      </div>

      <div className="space-y-4">
        {list.map(r => {
          const flat = r.homeowner?.flats?.[0]?.flat
          return (
            <div key={r.id} className="card p-6 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
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
                  <h3 className="font-heading text-lg font-bold text-bhuid-green mt-1">
                    {r.homeowner?.name} · Flat {flat ? `${flat.wing ? flat.wing + '-' : ''}${flat.flatNumber}` : 'N/A'}{' '}
                    ({r.society?.name})
                  </h3>
                  <div className="text-xs text-neutral-600 mt-0.5">Purpose: {r.purpose}</div>
                </div>

                <div className="text-right text-xs text-neutral-500 space-y-0.5">
                  <div>
                    Key 1 (Society): <strong>{r.societyApproval?.decision || 'PENDING'}</strong>
                  </div>
                  <div>
                    Key 2 (Homeowner): <strong>{r.homeownerConsent?.decision || 'PENDING'}</strong>
                  </div>
                  <div>Expires: {new Date(r.expiryDate).toLocaleDateString()}</div>
                </div>
              </div>
              {r.societyApproval?.note && (
                <div className="text-xs text-neutral-500 bg-bhuid-ivory/60 px-3 py-2 rounded-lg">
                  Society Note: {r.societyApproval.note}
                </div>
              )}
            </div>
          )
        })}

        {list.length === 0 && (
          <div className="card p-10 text-center text-neutral-400 text-sm">No access requests submitted yet.</div>
        )}
      </div>
    </div>
  )
}
