import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import type { Society, HomeownerRecord } from '../../types'

const INFO_OPTS = ['Name', 'Contact number', 'Email', 'Property ID', 'Flat details', 'Address']
const DOC_OPTS = [
  'Sale deed',
  'Agreement for sale',
  'Registration documents',
  'Index II',
  'Property tax receipts',
  'Society share certificate',
  'Maintenance receipts',
  'Loan sanction letter',
  'Loan statements',
  'Repayment-related records',
  'No-objection certificate',
]

export default function RequestAccess() {
  const [society, setSociety] = useState<Society | null>(null)
  const [homeowner, setHomeowner] = useState<HomeownerRecord | null>(null)
  const [form, setForm] = useState({
    purpose: 'Home Loan Mortgage Underwriting & Title Verification',
    requestedInfo: ['Name', 'Property ID', 'Flat details', 'Address'],
    requestedDocs: ['Sale deed', 'Society share certificate', 'Property tax receipts', 'Loan sanction letter'],
    explanation: 'Required for processing mortgage application and verifying society membership.',
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setSociety(JSON.parse(localStorage.getItem('bhuid_selected_society') || 'null'))
    setHomeowner(JSON.parse(localStorage.getItem('bhuid_selected_homeowner') || 'null'))
  }, [])

  const toggle = (key: 'requestedInfo' | 'requestedDocs', val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    if (!society || !homeowner) {
      setErr('Please select a society and homeowner first.')
      return
    }
    if (form.requestedInfo.length === 0 || form.requestedDocs.length === 0) {
      setErr('Select at least one information field and one document category.')
      return
    }
    setLoading(true)
    try {
      const r = await api.post('/bank/requests', {
        societyId: society.id,
        homeownerId: homeowner.id,
        flatNumber: homeowner.flats?.[0]?.flatNumber,
        purpose: form.purpose,
        requestedInfo: form.requestedInfo,
        requestedDocs: form.requestedDocs,
        explanation: form.explanation,
        expiryDate: form.expiryDate || undefined,
      })
      setMsg(
        `Request ${r.data.accessRequest.requestId} submitted! Notifications sent to Society Admin (Key 1) and Homeowner (Key 2).`
      )
      setTimeout(() => navigate('/bank/requests'), 1300)
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Could not submit access request')
    } finally {
      setLoading(false)
    }
  }

  if (!society || !homeowner) {
    return (
      <div className="card p-10 text-center space-y-4">
        <h2 className="font-heading text-xl font-bold text-bhuid-green">Select Society &amp; Homeowner First</h2>
        <p className="text-sm text-neutral-500">
          Use Society Search and Homeowner Search to choose the resident whose records you need to verify.
        </p>
        <Link to="/bank/search-societies" className="btn btn-primary">
          Search Societies
        </Link>
      </div>
    )
  }

  const primaryFlat = homeowner.flats?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Request Property Record Access</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Submit a targeted verification request. Access is granted only after both Society Approval (Key 1) and
          Homeowner Consent (Key 2).
        </p>
      </div>

      {/* Selected Target Summary */}
      <div className="card p-5 bg-bhuid-ivory/70 border border-bhuid-gold flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-bhuid-forest font-bold">Target Property Record</div>
          <div className="font-heading text-lg font-bold text-bhuid-green mt-0.5">
            {homeowner.name} · Flat{' '}
            {primaryFlat ? `${primaryFlat.wing ? primaryFlat.wing + '-' : ''}${primaryFlat.flatNumber}` : 'N/A'}
          </div>
          <div className="text-xs text-neutral-600">
            Society: {society.name} ({society.societyId})
          </div>
        </div>
        <Link to="/bank/homeowner-search" className="text-xs text-bhuid-forest font-semibold underline">
          Change Homeowner
        </Link>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={18} /> <span>{msg}</span>
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} /> <span>{err}</span>
        </div>
      )}

      <form onSubmit={submit} className="card p-7 space-y-6 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Stated Purpose of Verification *</label>
            <input
              className="input"
              required
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Access Grant Expiry Date *</label>
            <input
              className="input"
              type="date"
              required
              value={form.expiryDate}
              onChange={e => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Requested Homeowner &amp; Property Information Fields *</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {INFO_OPTS.map(o => {
              const active = form.requestedInfo.includes(o)
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => toggle('requestedInfo', o)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
                    active
                      ? 'bg-bhuid-green text-bhuid-ivory border-bhuid-green'
                      : 'bg-white text-bhuid-charcoal border-neutral-300 hover:border-bhuid-forest'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {o}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="label">Requested Document Categories *</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {DOC_OPTS.map(o => {
              const active = form.requestedDocs.includes(o)
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => toggle('requestedDocs', o)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
                    active
                      ? 'bg-bhuid-forest text-bhuid-ivory border-bhuid-forest'
                      : 'bg-white text-bhuid-charcoal border-neutral-300 hover:border-bhuid-forest'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {o}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="label">Additional Explanation / Application Reference</label>
          <textarea
            className="input"
            rows={3}
            value={form.explanation}
            onChange={e => setForm({ ...form, explanation: e.target.value })}
          />
        </div>

        <button className="btn btn-primary px-8 py-3" type="submit" disabled={loading}>
          <Send size={16} />
          <span>{loading ? 'Submitting Request...' : 'Submit Two-Key Access Request'}</span>
        </button>
      </form>
    </div>
  )
}
