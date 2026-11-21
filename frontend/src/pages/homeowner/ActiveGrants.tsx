import { useState, useEffect } from 'react'
import { ShieldOff, FileText } from 'lucide-react'
import api from '../../services/api'
import type { AccessGrant } from '../../types'

export default function ActiveGrants() {
  const [list, setList] = useState<AccessGrant[]>([])
  const [msg, setMsg] = useState('')

  const load = () => {
    api
      .get('/homeowner/grants')
      .then(r => setList(r.data.grants || []))
      .catch(() => {})
  }

  useEffect(load, [])

  const revoke = async (id: string) => {
    await api.post(`/homeowner/grants/${id}/revoke`)
    setMsg('Access grant revoked immediately. The bank can no longer view or download your documents.')
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Active &amp; Historical Access Grants</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Inspect every time-limited access grant issued under your consent and revoke active bank access at any time.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          {msg}
        </div>
      )}

      <div className="space-y-4">
        {list.map(g => (
          <div key={g.id} className="card p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-bhuid-forest">{g.grantId}</span>
                  <span className={`badge ${g.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{g.status}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-bhuid-green mt-1">{g.bank?.name}</h3>
                <div className="text-xs text-neutral-500">
                  Created: {new Date(g.createdAt).toLocaleString()} · Expires:{' '}
                  {new Date(g.expiryDate).toLocaleDateString()}
                </div>
              </div>

              {g.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => revoke(g.id)}
                  className="btn bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs"
                >
                  <ShieldOff size={15} /> Revoke Bank Access
                </button>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-2">
                Disclosed Documents ({g.documents?.length || 0}):
              </div>
              <div className="flex flex-wrap gap-2">
                {(g.documents || []).map(d => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-bhuid-ivory border border-neutral-200 text-xs"
                  >
                    <FileText size={13} className="text-bhuid-forest" />
                    <span>{d.document?.subcategory || d.document?.originalName}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <div className="card p-10 text-center text-neutral-400 text-sm">No access grants issued yet.</div>
        )}
      </div>
    </div>
  )
}
