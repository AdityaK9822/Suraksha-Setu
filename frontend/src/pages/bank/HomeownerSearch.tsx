import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Lock, Send } from 'lucide-react'
import api from '../../services/api'
import type { Society, HomeownerRecord } from '../../types'

export default function HomeownerSearch() {
  const [society, setSociety] = useState<Society | null>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<HomeownerRecord[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('bhuid_selected_society') || 'null')
    setSociety(s)
  }, [])

  useEffect(() => {
    if (!society) return
    const t = setTimeout(() => {
      api
        .get(`/bank/societies/${society.id}/homeowners`, { params: { q } })
        .then(r => setResults(r.data.homeowners || []))
        .catch(() => {})
    }, 220)
    return () => clearTimeout(t)
  }, [q, society])

  const select = (h: HomeownerRecord) => {
    localStorage.setItem('bhuid_selected_homeowner', JSON.stringify(h))
    navigate('/bank/request-access')
  }

  if (!society) {
    return (
      <div className="card p-10 text-center space-y-4">
        <h2 className="font-heading text-xl font-bold text-bhuid-green">No Housing Society Selected</h2>
        <p className="text-sm text-neutral-500">
          Please select a housing society first to search its resident directory.
        </p>
        <Link to="/bank/search-societies" className="btn btn-primary">
          Search Societies
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-bhuid-forest">
            Selected Society: {society.societyId}
          </span>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green mt-0.5">{society.name}</h1>
          <p className="text-sm text-neutral-500">
            {society.address}, {society.city}, {society.state} · Private documents are hidden prior to Two-Key
            Authorisation.
          </p>
        </div>
        <Link to="/bank/search-societies" className="btn btn-outline text-xs">
          Change Society
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-3 text-neutral-400" />
        <input
          className="input pl-10"
          placeholder="Search by homeowner name, flat number, or wing..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {results.map(h => (
          <div key={h.id} className="card p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-heading text-lg font-bold text-bhuid-green">{h.name}</div>
              <div className="text-xs text-neutral-600">
                Unit:{' '}
                <strong>
                  {h.flats?.map(f => `${f.wing ? `Wing ${f.wing} · ` : ''}Flat ${f.flatNumber}`).join(', ') || '—'}
                </strong>
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 pt-1">
                <Lock size={12} className="text-bhuid-forest" />
                <span>Private records protected · Requires Society + Owner approval</span>
              </div>
            </div>

            <button className="btn btn-primary text-xs shrink-0" onClick={() => select(h)}>
              <Send size={14} /> Request Access
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
