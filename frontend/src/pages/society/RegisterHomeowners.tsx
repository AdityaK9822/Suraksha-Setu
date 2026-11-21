import { useState, useEffect, type FormEvent } from 'react'
import { UserPlus, Search, Edit3, Power, Mail, Eye } from 'lucide-react'
import api from '../../services/api'
import type { Society, HomeownerRecord } from '../../types'

export default function RegisterHomeowners() {
  const [society, setSociety] = useState<Society | null>(null)
  const [homeowners, setHomeowners] = useState<HomeownerRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [editing, setEditing] = useState<HomeownerRecord | null>(null)
  const [viewing, setViewing] = useState<HomeownerRecord | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    flatNumber: '',
    wing: 'A',
    societyAddress: '',
    ownershipCategory: 'Primary Owner',
    password: '',
  })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = () => {
    api
      .get('/society-admin/me')
      .then(r => {
        setSociety(r.data.society)
        setForm(f => ({
          ...f,
          societyAddress: `${r.data.society.address}, ${r.data.society.city}`,
        }))
        return api.get(`/societies/${r.data.society.id}/homeowners`)
      })
      .then(r => setHomeowners(r.data.homeowners || []))
      .catch(() => {})
  }

  useEffect(load, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!society) return
    setMsg('')
    setErr('')
    try {
      if (editing) {
        await api.put(`/homeowners/${editing.id}`, form)
        setMsg(`Updated homeowner profile for ${form.name}.`)
        setEditing(null)
      } else {
        const r = await api.post(`/societies/${society.id}/homeowners`, form)
        setMsg(
          `Registered ${r.data.homeowner?.name} to Flat ${form.wing ? form.wing + '-' : ''}${
            form.flatNumber
          } (Property ID: ${r.data.property?.propertyId || 'Linked'}). ${
            r.data.temporaryPassword ? `Default login password: ${r.data.temporaryPassword}` : ''
          }`
        )
      }
      setForm({
        name: '',
        email: '',
        phone: '',
        flatNumber: '',
        wing: 'A',
        societyAddress: society ? `${society.address}, ${society.city}` : '',
        ownershipCategory: 'Primary Owner',
        password: '',
      })
      load()
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Could not register homeowner')
    }
  }

  const startEdit = (h: HomeownerRecord) => {
    const f = h.flats?.[0]?.flat
    setEditing(h)
    setForm({
      name: h.name,
      email: h.email,
      phone: h.phone || '',
      flatNumber: f?.flatNumber || '',
      wing: f?.wing || 'A',
      societyAddress: society ? `${society.address}, ${society.city}` : '',
      ownershipCategory: h.ownershipCategory || 'Primary Owner',
      password: '',
    })
  }

  const toggleActive = async (h: HomeownerRecord) => {
    await api.post(`/homeowners/${h.id}/deactivate`)
    setMsg(`Toggled account status for ${h.name}.`)
    load()
  }

  const sendInvite = (h: HomeownerRecord) => {
    setMsg(`Invitation & portal credentials dispatched to ${h.name} (${h.email}) [Simulated].`)
  }

  const filtered = homeowners.filter(h => {
    const f = h.flats?.[0]?.flat
    const q = search.toLowerCase()
    const matchText =
      (h.name || '').toLowerCase().includes(q) ||
      (h.email || '').toLowerCase().includes(q) ||
      (f?.flatNumber || '').toLowerCase().includes(q) ||
      (f?.wing || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'ALL' || h.status === statusFilter
    return matchText && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Register &amp; Manage Homeowners</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Onboard individual homeowners or co-owners and link them to their respective society flat and Property ID.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {msg}
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{err}</div>
      )}

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h2 className="font-heading text-lg font-bold text-bhuid-green flex items-center gap-2">
            <UserPlus size={18} />
            <span>{editing ? `Edit Homeowner: ${editing.name}` : 'Register Individual Homeowner'}</span>
          </h2>
          {editing && (
            <button type="button" onClick={() => setEditing(null)} className="text-xs text-neutral-500 underline">
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Homeowner Full Name *</label>
            <input
              className="input"
              required
              placeholder="e.g. Aarav Sharma"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email Address (Login ID) *</label>
            <input
              className="input"
              type="email"
              required
              disabled={Boolean(editing)}
              placeholder="resident@greenvalley.demo"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input
              className="input"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Building / Wing *</label>
            <input
              className="input"
              required
              placeholder="e.g. A or Building A"
              value={form.wing}
              onChange={e => setForm({ ...form, wing: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Flat Number *</label>
            <input
              className="input"
              required
              placeholder="e.g. 101"
              value={form.flatNumber}
              onChange={e => setForm({ ...form, flatNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Ownership / Occupancy Category</label>
            <select
              className="input"
              value={form.ownershipCategory}
              onChange={e => setForm({ ...form, ownershipCategory: e.target.value })}
            >
              <option value="Primary Owner">Primary Owner</option>
              <option value="Co-Owner">Co-Owner (Joint Flat Association)</option>
              <option value="Family Member">Authorised Family Member</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Society Address</label>
            <input
              className="input bg-bhuid-ivory/40"
              value={form.societyAddress}
              onChange={e => setForm({ ...form, societyAddress: e.target.value })}
            />
          </div>
          {!editing && (
            <div>
              <label className="label">Initial Password (Optional)</label>
              <input
                className="input"
                type="password"
                placeholder="Defaults to Password@123"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
          )}
        </div>

        <button className="btn btn-primary">
          {editing ? 'Update Homeowner Profile' : 'Register Homeowner & Link Flat'}
        </button>
      </form>

      {/* Search, Filter & Manage Registered Homeowners */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-bold text-bhuid-green">Registered Society Homeowners</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-neutral-400" />
              <input
                className="input pl-9 py-2 text-xs w-64"
                placeholder="Search name, email, flat, wing..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input py-2 text-xs w-36"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Homeowner</th>
                <th>Flat &amp; Wing</th>
                <th>Property ID</th>
                <th>Category</th>
                <th>Docs</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => {
                const flat = h.flats?.[0]?.flat
                return (
                  <tr key={h.id}>
                    <td>
                      <div className="font-semibold text-bhuid-green">{h.name}</div>
                      <div className="text-xs text-neutral-500">{h.email}</div>
                    </td>
                    <td className="font-medium">
                      {flat ? `${flat.wing ? `Wing ${flat.wing} · ` : ''}Flat ${flat.flatNumber}` : '—'}
                    </td>
                    <td className="font-mono text-xs text-bhuid-forest">{flat?.property?.propertyId || '—'}</td>
                    <td className="text-xs">{h.ownershipCategory || 'Owner'}</td>
                    <td className="text-xs font-semibold">{h.documents?.length || 0} files</td>
                    <td>
                      <span className={`badge ${h.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{h.status}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewing(h)}
                          className="p-1.5 rounded hover:bg-bhuid-ivory text-bhuid-green"
                          title="View Profile"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(h)}
                          className="p-1.5 rounded hover:bg-bhuid-ivory text-bhuid-forest"
                          title="Edit Homeowner"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => sendInvite(h)}
                          className="p-1.5 rounded hover:bg-bhuid-ivory text-amber-700"
                          title="Send Invite"
                        >
                          <Mail size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(h)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-700"
                          title={h.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Homeowner Profile Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-bhuid-forest font-bold">Homeowner Profile</div>
                <h3 className="font-heading text-xl font-bold text-bhuid-green">{viewing.name}</h3>
              </div>
              <button onClick={() => setViewing(null)} className="text-sm text-neutral-500 hover:text-black">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-bhuid-ivory/60">
                <div className="text-neutral-500">Email</div>
                <div className="font-semibold mt-0.5">{viewing.email}</div>
              </div>
              <div className="p-3 rounded-lg bg-bhuid-ivory/60">
                <div className="text-neutral-500">Phone</div>
                <div className="font-semibold mt-0.5">{viewing.phone || '—'}</div>
              </div>
              <div className="p-3 rounded-lg bg-bhuid-ivory/60">
                <div className="text-neutral-500">Associated Flats</div>
                <div className="font-semibold mt-0.5">
                  {viewing.flats?.map(f => `${f.flat.wing || ''}-${f.flat.flatNumber}`).join(', ') || '—'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-bhuid-ivory/60">
                <div className="text-neutral-500">Uploaded Documents</div>
                <div className="font-semibold mt-0.5">{viewing.documents?.length || 0} records</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewing(null)} className="btn btn-primary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
