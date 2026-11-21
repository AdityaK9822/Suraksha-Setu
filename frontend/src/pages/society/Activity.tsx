import { useState, useEffect } from 'react'
import api from '../../services/api'
import type { ActivityRecord } from '../../types'

export default function SocietyActivity() {
  const [list, setList] = useState<ActivityRecord[]>([])
  useEffect(() => {
    api
      .get('/activity')
      .then(r => setList(r.data.activities || []))
      .catch(() => {})
  }, [])
  return (
    <div>
      <h1 className="font-heading text-3xl text-bhuid-green mb-6">Activity History</h1>
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {list.map(a => (
              <tr key={a.id}>
                <td>{a.action}</td>
                <td>
                  {a.entity} {a.entityId}
                </td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
