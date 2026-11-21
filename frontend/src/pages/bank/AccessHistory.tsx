import { useState, useEffect } from 'react'
import api from '../../services/api'
import type { AccessGrant, ActivityRecord } from '../../types'

export default function AccessHistory() {
  const [grants, setGrants] = useState<AccessGrant[]>([])
  const [activities, setActivities] = useState<ActivityRecord[]>([])

  useEffect(() => {
    api
      .get('/bank/records')
      .then(r => setGrants(r.data.allGrants || r.data.grants || []))
      .catch(() => {})
    api
      .get('/activity')
      .then(r => setActivities(r.data.activities || []))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Access &amp; Grant Audit History</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Complete ledger of active, expired, and revoked grants alongside logged document previews and downloads.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 font-heading font-bold text-bhuid-green">
          All Access Grants (Active · Expired · Revoked)
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Grant ID</th>
              <th>Homeowner</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {grants.map(g => (
              <tr key={g.id}>
                <td className="font-mono text-xs font-bold text-bhuid-forest">{g.grantId}</td>
                <td className="font-semibold text-bhuid-green">{g.homeowner?.name}</td>
                <td>{g.documents?.length || 0} files</td>
                <td>
                  <span className={`badge ${g.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{g.status}</span>
                </td>
                <td className="text-xs text-neutral-500">{new Date(g.expiryDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {grants.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-neutral-400 py-6">
                  No access grants recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 font-heading font-bold text-bhuid-green">
          Bank Officer Audit Trail
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Metadata</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id}>
                <td className="font-mono text-xs font-semibold text-bhuid-green">{a.action}</td>
                <td className="text-xs">{a.entity}</td>
                <td className="font-mono text-xs text-neutral-500">{a.metadata || '—'}</td>
                <td className="text-xs text-neutral-500">{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
