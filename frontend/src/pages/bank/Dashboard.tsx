import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, ArrowRight } from 'lucide-react'
import api from '../../services/api'
import type { BankProfile, Society, AccessRequest } from '../../types'

interface BankDashboardData {
  stats?: {
    pending: number
    approved: number
    rejected: number
    activeGrants: number
    expired: number
  }
  recent?: AccessRequest[]
}

type BankFormKeys = 'name' | 'branch' | 'officialEmail' | 'contactNumber' | 'authorisedUser' | 'designation'

export default function BankDashboard() {
  const [data, setData] = useState<BankDashboardData | null>(null)
  const [profile, setProfile] = useState<BankProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Society[]>([])
  const [recentSearches, setRecentSearches] = useState<Society[]>([])
  const [form, setForm] = useState<Record<BankFormKeys, string>>({
    name: '',
    branch: '',
    officialEmail: '',
    contactNumber: '',
    authorisedUser: '',
    designation: '',
  })
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const p = await api.get('/bank/profile')
      setProfile(p.data.bank)
      const d = await api.get('/bank/dashboard')
      setData(d.data)
    } catch (e: any) {
      if (e.response?.status === 404) setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const saved = JSON.parse(localStorage.getItem('bhuid_recent_society_searches') || '[]')
    setRecentSearches(saved)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length < 1) {
        setSuggestions([])
        return
      }
      api
        .get('/societies/search', { params: { q } })
        .then(r => setSuggestions(r.data.societies || []))
        .catch(() => {})
    }, 220)
    return () => clearTimeout(t)
  }, [q])

  const selectSociety = (s: Society) => {
    localStorage.setItem('bhuid_selected_society', JSON.stringify(s))
    const nextRecent = [s, ...recentSearches.filter(x => x.id !== s.id)].slice(0, 5)
    localStorage.setItem('bhuid_recent_society_searches', JSON.stringify(nextRecent))
    navigate('/bank/homeowner-search')
  }

  const register = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/bank/register', form)
      setMsg('Institution profile registered (Simulated Verification: VERIFIED).')
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Could not register bank')
    }
  }

  if (loading) return <div className="p-8 text-sm text-neutral-500">Loading bank portal...</div>

  if (!profile) {
    const fields: Array<[BankFormKeys, string, boolean, string]> = [
      ['name', 'Institution Name *', true, 'e.g. Demo National Bank'],
      ['branch', 'Branch / Office *', true, 'e.g. Mumbai Fort Corporate'],
      ['officialEmail', 'Official Email *', true, 'credit@bank.demo'],
      ['contactNumber', 'Contact Number', false, '+91 22 4000 0000'],
      ['authorisedUser', 'Authorised Officer Name *', true, 'e.g. Vikramaditya Sen'],
      ['designation', 'Designation *', true, 'e.g. Senior Mortgage Officer'],
    ]

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <span className="badge badge-gold uppercase tracking-wider mb-2">Simulated Bank Verification</span>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">Financial Institution Registration</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Complete your institution and branch profile to initiate consent-backed society and homeowner record
            requests.
          </p>
        </div>
        {msg && <div className="p-3.5 rounded-xl bg-blue-50 text-blue-800 text-sm">{msg}</div>}
        <form onSubmit={register} className="card p-7 grid md:grid-cols-2 gap-4">
          {fields.map(([k, l, req, ph]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input
                className="input"
                required={req}
                placeholder={ph}
                value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
          <div className="md:col-span-2 pt-2">
            <button className="btn btn-primary w-full py-3">
              Complete Bank Registration (Simulated Verification)
            </button>
          </div>
        </form>
      </div>
    )
  }

  const s = data?.stats || { pending: 0, approved: 0, rejected: 0, activeGrants: 0, expired: 0 }

  return (
    <div className="space-y-8">
      {/* Bank Profile Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-bhuid-forest bg-bhuid-green/10 px-3 py-1 rounded-full mb-2">
            <ShieldCheck size={14} />
            <span>Verified Institution (Simulated Demo Verification)</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">{profile.name}</h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            Branch: {profile.branch || 'Main'} · Officer: {profile.authorisedUser} ({profile.designation})
          </p>
        </div>
        <Link to="/bank/records" className="btn btn-gold text-xs sm:text-sm font-semibold">
          View Approved Records ({s.activeGrants}) →
        </Link>
      </div>

      {/* Prominent Society Search Bar with Live Suggestions */}
      <div className="card p-6 bg-gradient-to-r from-bhuid-green to-bhuid-forest text-bhuid-ivory space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold">Quick Society Lookup &amp; Homeowner Verification</h2>
            <p className="text-xs text-bhuid-ivory/75">
              Type a housing society name, city, registration number, or Society ID to view live suggestions.
            </p>
          </div>
          <Link to="/bank/directory" className="text-xs text-bhuid-gold underline">
            Browse All Societies →
          </Link>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-neutral-400" />
          <input
            className="w-full rounded-xl bg-white text-bhuid-charcoal pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bhuid-gold"
            placeholder="Search society (e.g. Green Valley Residency, Mumbai, SOC-GVR-001)..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="mt-2 rounded-xl bg-white text-bhuid-charcoal shadow-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
              {suggestions.map(soc => (
                <div
                  key={soc.id}
                  onClick={() => selectSociety(soc)}
                  className="p-3.5 hover:bg-bhuid-ivory/70 cursor-pointer flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-heading font-bold text-sm text-bhuid-green">{soc.name}</div>
                    <div className="text-xs text-neutral-500">
                      {soc.address}, {soc.city}, {soc.state} · <span className="font-mono">{soc.societyId}</span>
                      {soc.registrationNo ? ` · Reg: ${soc.registrationNo}` : ''}
                    </div>
                  </div>
                  <span className="btn btn-primary py-1.5 px-3 text-xs">Select Society →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-bhuid-ivory/65">Recent Societies:</span>
            {recentSearches.map(rs => (
              <button
                key={rs.id}
                type="button"
                onClick={() => selectSociety(rs)}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-bhuid-ivory transition"
              >
                {rs.name} ({rs.city})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5 Metric Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {(
          [
            ['Pending Requests', s.pending, 'Awaiting Key 1 or Key 2'],
            ['Approved Requests', s.approved, 'Dual-key completed'],
            ['Rejected Requests', s.rejected, 'Declined by society/owner'],
            ['Active Access Grants', s.activeGrants, 'Currently accessible'],
            ['Expired / Revoked', s.expired, 'Access terminated'],
          ] as const
        ).map(([label, val, sub]) => (
          <div key={label} className="card p-5">
            <div className="text-xs font-medium text-neutral-500">{label}</div>
            <div className="text-3xl font-heading font-bold text-bhuid-green mt-1">{val}</div>
            <div className="text-[11px] text-neutral-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Requests Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-bhuid-green">Recent Verification Requests</h2>
          <Link to="/bank/requests" className="text-xs text-bhuid-forest hover:underline flex items-center gap-1">
            All Requests <ArrowRight size={13} />
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Homeowner</th>
              <th>Society</th>
              <th>Purpose</th>
              <th>Two-Key Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recent || []).map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs font-bold text-bhuid-forest">{r.requestId}</td>
                <td className="font-semibold text-bhuid-green">{r.homeowner?.name}</td>
                <td>{r.society?.name}</td>
                <td className="text-xs">{r.purpose}</td>
                <td>
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
                </td>
                <td className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!data?.recent || data.recent.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center text-neutral-400 py-8">
                  No requests submitted yet. Search a society above to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
