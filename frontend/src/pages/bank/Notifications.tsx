import { useState, useEffect } from 'react'
import api from '../../services/api'
import type { NotificationRecord } from '../../types'

export default function BankNotifications() {
  const [list, setList] = useState<NotificationRecord[]>([])
  useEffect(() => {
    api
      .get('/notifications')
      .then(r => setList(r.data.notifications || []))
      .catch(() => {})
  }, [])
  return (
    <div>
      <h1 className="font-heading text-3xl text-bhuid-green mb-6">Notifications</h1>
      <div className="space-y-2">
        {list.map(n => (
          <div key={n.id} className={`card p-4 ${n.read ? 'opacity-60' : ''}`}>
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm text-neutral-600">{n.message}</div>
            <div className="text-xs text-neutral-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            {!n.read && (
              <button
                className="text-xs text-bhuid-forest underline mt-1"
                onClick={async () => {
                  await api.post(`/notifications/${n.id}/read`)
                  setList(l => l.map(x => (x.id === n.id ? { ...x, read: true } : x)))
                }}
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
