import { useState, useEffect, type FormEvent } from 'react'
import { Building2, UserCog, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import type { Society } from '../../types'

export default function CreateSociety() {
  const [form, setForm] = useState({
    name: '',
    registrationNo: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    buildingsCount: 1 as number | string,
    totalFlats: 24 as number | string,
    contactEmail: '',
    contactPhone: '',
    chairmanName: '',
    chairmanEmail: '',
    chairmanPhone: '',
    secretaryName: '',
    secretaryEmail: '',
    secretaryPhone: '',
    treasurerName: '',
    treasurerEmail: '',
    treasurerPhone: '',
  })
  const [society, setSociety] = useState<Society | null>(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api
      .get('/society-admin/me')
      .then(r => {
        if (r.data.society) {
          const s: Society = r.data.society
          setSociety(s)
          setForm(f => ({
            ...f,
            name: s.name || '',
            registrationNo: s.registrationNo || '',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            pincode: s.pincode || '',
            buildingsCount: s.buildingsCount || 1,
            totalFlats: s.totalFlats || 1,
            contactEmail: s.contactEmail || '',
            contactPhone: s.contactPhone || '',
          }))
        }
      })
      .catch(() => {})
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    setLoading(true)
    try {
      if (society) {
        const r = await api.put(`/societies/${society.id}`, form)
        setSociety(r.data.society)
        setMsg(`Society profile updated (${r.data.society.societyId}).`)
      } else {
        const r = await api.post('/societies', form)
        setSociety(r.data.society)
        setMsg(`Society created successfully with unique ID: ${r.data.society.societyId}`)
      }
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Could not save society details')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">Create / Manage Housing Society</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Establish the official society profile and generate a unique Suraksha Setu Society Identifier.
          </p>
        </div>
        {society && (
          <div className="px-4 py-2 rounded-xl bg-bhuid-green text-bhuid-ivory text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="text-bhuid-gold" />
            <span>
              Active Society ID: <strong className="font-mono text-bhuid-gold">{society.societyId}</strong>
            </span>
          </div>
        )}
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {msg}
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{err}</div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <Building2 size={18} className="text-bhuid-green" />
            <h2 className="font-heading text-lg font-bold text-bhuid-green">1. Society Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Society Full Name *</label>
              <input
                className="input"
                required
                placeholder="e.g. Green Valley Residency Co-op Housing Society Ltd."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Registration Number (if applicable)</label>
              <input
                className="input"
                placeholder="e.g. REG-MH-2024-001"
                value={form.registrationNo}
                onChange={e => setForm({ ...form, registrationNo: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Full Street Address *</label>
              <input
                className="input"
                required
                placeholder="Plot number, street, sector or locality"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="label">City *</label>
              <input
                className="input"
                required
                placeholder="Mumbai"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">State *</label>
                <input
                  className="input"
                  required
                  placeholder="Maharashtra"
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div>
                <label className="label">PIN Code *</label>
                <input
                  className="input"
                  required
                  placeholder="400001"
                  value={form.pincode}
                  onChange={e => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Number of Buildings / Wings</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.buildingsCount}
                  onChange={e => setForm({ ...form, buildingsCount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Total Residential Flats</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.totalFlats}
                  onChange={e => setForm({ ...form, totalFlats: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Official Contact Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="office@society.demo"
                  value={form.contactEmail}
                  onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Official Contact Number</label>
                <input
                  className="input"
                  placeholder="+91 98765 43210"
                  value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* If creating a brand new society, allow entering Chairman, Secretary, Treasurer in the same step */}
        {!society && (
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
              <UserCog size={18} className="text-bhuid-green" />
              <div>
                <h2 className="font-heading text-lg font-bold text-bhuid-green">
                  2. Main Office Bearers (Chairman · Secretary · Treasurer)
                </h2>
                <p className="text-xs text-neutral-500">
                  Optional during creation — can also be managed anytime under the Office Bearers tab.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-bhuid-ivory/60 border border-neutral-200 space-y-3">
                <span className="badge badge-gold">Chairman</span>
                <input
                  className="input"
                  placeholder="Chairman Full Name"
                  value={form.chairmanName}
                  onChange={e => setForm({ ...form, chairmanName: e.target.value })}
                />
                <input
                  className="input"
                  type="email"
                  placeholder="Chairman Email"
                  value={form.chairmanEmail}
                  onChange={e => setForm({ ...form, chairmanEmail: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Chairman Phone"
                  value={form.chairmanPhone}
                  onChange={e => setForm({ ...form, chairmanPhone: e.target.value })}
                />
              </div>

              <div className="p-4 rounded-xl bg-bhuid-ivory/60 border border-neutral-200 space-y-3">
                <span className="badge badge-gold">Secretary</span>
                <input
                  className="input"
                  placeholder="Secretary Full Name"
                  value={form.secretaryName}
                  onChange={e => setForm({ ...form, secretaryName: e.target.value })}
                />
                <input
                  className="input"
                  type="email"
                  placeholder="Secretary Email"
                  value={form.secretaryEmail}
                  onChange={e => setForm({ ...form, secretaryEmail: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Secretary Phone"
                  value={form.secretaryPhone}
                  onChange={e => setForm({ ...form, secretaryPhone: e.target.value })}
                />
              </div>

              <div className="p-4 rounded-xl bg-bhuid-ivory/60 border border-neutral-200 space-y-3">
                <span className="badge badge-gold">Treasurer</span>
                <input
                  className="input"
                  placeholder="Treasurer Full Name"
                  value={form.treasurerName}
                  onChange={e => setForm({ ...form, treasurerName: e.target.value })}
                />
                <input
                  className="input"
                  type="email"
                  placeholder="Treasurer Email"
                  value={form.treasurerEmail}
                  onChange={e => setForm({ ...form, treasurerEmail: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Treasurer Phone"
                  value={form.treasurerPhone}
                  onChange={e => setForm({ ...form, treasurerPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <button className="btn btn-primary px-8 py-3" disabled={loading}>
            {loading ? 'Saving...' : society ? 'Update Society Record' : 'Create Society & Generate Society ID'}
          </button>
        </div>
      </form>
    </div>
  )
}
