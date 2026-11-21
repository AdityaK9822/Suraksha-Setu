import { useState, type FormEvent } from 'react'
import { KeyRound, User, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function SettingsPanel() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const r = await api.post('/auth/update-password', { currentPassword, newPassword })
      setMsg(r.data.message || 'Password updated.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Could not update password')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Account &amp; Security Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your authenticated session, profile identity, and password credentials.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
          <User size={18} className="text-bhuid-green" />
          <h2 className="font-heading text-lg font-bold text-bhuid-green">Authenticated Identity</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-neutral-500">Full Name</div>
            <div className="font-semibold text-bhuid-green mt-0.5">{user?.name}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Official Email</div>
            <div className="font-semibold mt-0.5">{user?.email}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Assigned Role</div>
            <div className="font-mono text-xs font-bold text-bhuid-forest mt-0.5">{user?.role}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Security Mode</div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <ShieldCheck size={14} /> JWT + Backend Role Enforcement Active
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handlePasswordChange} className="card p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
          <KeyRound size={18} className="text-bhuid-green" />
          <h2 className="font-heading text-lg font-bold text-bhuid-green">Change Account Password</h2>
        </div>

        {msg && <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">{msg}</div>}
        {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">{err}</div>}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">New Password (min 6 chars)</label>
            <input
              type="password"
              className="input"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary text-xs">Update Password</button>
      </form>
    </div>
  )
}
