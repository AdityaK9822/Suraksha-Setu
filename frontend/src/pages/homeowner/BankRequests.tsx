import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import type { AccessRequest } from '../../types'

export default function HomeownerBankRequests() {
  const [list, setList] = useState<AccessRequest[]>([])
  useEffect(() => {
    api
      .get('/homeowner/requests')
      .then(r => setList(r.data.requests || []))
      .catch(() => {})
  }, [])

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">Incoming Bank Requests</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track the Two-Key status of every bank request for your property records.
          </p>
        </div>
        <Link to="/homeowner/consent" className="btn btn-primary text-xs sm:text-sm">
          Open Consent Management (Key 2) →
        </Link>
      </div>

      <div className="space-y-4">
        {list.map(r => {
          const infoList = parseList(r.requestedInfo)
          const docList = parseList(r.requestedDocs)
          return (
            <div key={r.id} className="card p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-3">
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
                  <div className="text-xs text-neutral-500 mt-0.5">Purpose: {r.purpose}</div>
                </div>

                <div className="text-right text-xs text-neutral-500">
                  <div>Expires: {new Date(r.expiryDate).toLocaleDateString()}</div>
                  <div className="mt-1">
                    Key 1 (Society): <strong>{r.societyApproval?.decision || 'AWAITING_SOCIETY'}</strong>
                  </div>
                  <div>
                    Key 2 (Your Consent): <strong>{r.homeownerConsent?.decision || 'AWAITING_CONSENT'}</strong>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-neutral-500 font-semibold mb-1">Requested Information</div>
                  <div className="flex flex-wrap gap-1.5">
                    {infoList.map(i => (
                      <span key={i} className="px-2.5 py-1 rounded bg-bhuid-ivory border border-neutral-200">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 font-semibold mb-1">Requested Documents</div>
                  <div className="flex flex-wrap gap-1.5">
                    {docList.map(d => (
                      <span key={d} className="px-2.5 py-1 rounded bg-bhuid-ivory border border-neutral-200">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {r.status === 'SOCIETY_APPROVED' && !r.homeownerConsent && (
                <div className="pt-2 flex justify-end">
                  <Link to="/homeowner/consent" className="btn btn-primary text-xs">
                    Review &amp; Provide Key-2 Consent →
                  </Link>
                </div>
              )}
            </div>
          )
        })}

        {list.length === 0 && (
          <div className="card p-10 text-center text-neutral-400 text-sm">No bank requests received yet.</div>
        )}
      </div>
    </div>
  )
}
