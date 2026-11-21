import { useState, useEffect, type FormEvent } from 'react'
import { UserCog, Edit3, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import type { Society, OfficeBearer } from '../../types'

export default function OfficeBearers() {
  const [society, setSociety] = useState<Society | null>(null)
  const [list, setList] = useState<OfficeBearer[]>([])
  const [form, setForm] = useState({ name: '', designation: 'Chairman', email: '', phone: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = () => {
    api
      .get('/society-admin/me')
      .then(r => {
        setSociety(r.data.society)
        return api.get(`/societies/${r.data.society.id}/office-bearers`)
      })
      .then(r => setList(r.data.officeBearers || []))
      .catch(() => {})
  }

  useEffect(load, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!society) return
    setMsg('')
    setErr('')
    try {
      if (editingId) {
        await api.put(`/office-bearers/${editingId}`, form)
        setMsg(`Updated ${form.designation} representative: ${form.name}`)
        setEditingId(null)
      } else {
        await api.post(`/societies/${society.id}/office-bearers`, form)
        setMsg(`Registered ${form.designation} representative: ${form.name}`)
      }
      setForm({ name: '', designation: 'Chairman', email: '', phone: '' })
      load()
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Could not save representative')
    }
  }

  const startEdit = (ob: OfficeBearer) => {
    setEditingId(ob.id)
    setForm({ name: ob.name, designation: ob.designation, email: ob.email, phone: ob.phone || '' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Society Office Bearers</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Register and maintain the three statutory representatives (Chairman, Secretary, Treasurer) authorised to
          approve bank requests.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{msg}</div>
      )}
      {err && <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

      {/* 3 Role Cards Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {['Chairman', 'Secretary', 'Treasurer'].map(role => {
          const ob = list.find(x => x.designation === role)
          return (
            <div key={role} className="card p-5 border-t-4 border-t-bhuid-gold flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="badge badge-gold uppercase tracking-wider">{role}</span>
                  {ob && <CheckCircle2 size={16} className="text-bhuid-forest" />}
                </div>
                {ob ? (
                  <div className="mt-3 space-y-1">
                    <div className="font-heading text-lg font-bold text-bhuid-green">{ob.name}</div>
                    <div className="text-xs text-neutral-600">{ob.email}</div>
                    <div className="text-xs text-neutral-500">{ob.phone || '—'}</div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic mt-3">No {role} registered yet.</p>
                )}
              </div>
              {ob && (
                <button
                  type="button"
                  onClick={() => startEdit(ob)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-bhuid-forest font-semibold hover:underline"
                >
                  <Edit3 size={13} /> Edit {role}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-bhuid-green flex items-center gap-2">
            <UserCog size={18} />
            <span>{editingId ? 'Update Office Bearer' : 'Register / Update Office Bearer'}</span>
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm({ name: '', designation: 'Chairman', email: '', phone: '' })
              }}
              className="text-xs text-neutral-500 underline"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Ramesh Iyer"
            />
          </div>
          <div>
            <label className="label">Designation *</label>
            <select
              className="input"
              value={form.designation}
              onChange={e => setForm({ ...form, designation: e.target.value })}
            >
              <option value="Chairman">Chairman</option>
              <option value="Secretary">Secretary</option>
              <option value="Treasurer">Treasurer</option>
            </select>
          </div>
          <div>
            <label className="label">Official Email *</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              placeholder="bearer@society.demo"
            />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input
              className="input"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="9876543210"
            />
          </div>
        </div>
        <button className="btn btn-primary">{editingId ? 'Save Changes' : 'Save Office Bearer'}</button>
      </form>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Designation</th>
              <th>Full Name</th>
              <th>Official Email</th>
              <th>Contact Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(o => (
              <tr key={o.id}>
                <td>
                  <span className="badge badge-gold">{o.designation}</span>
                </td>
                <td className="font-semibold text-bhuid-green">{o.name}</td>
                <td>{o.email}</td>
                <td>{o.phone || '—'}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => startEdit(o)}
                    className="text-xs text-bhuid-forest font-semibold underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-neutral-400 py-6">
                  No office bearers registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
