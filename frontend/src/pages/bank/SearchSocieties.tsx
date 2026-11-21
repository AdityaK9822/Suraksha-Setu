import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, ArrowRight } from 'lucide-react'
import api from '../../services/api'
import type { Society } from '../../types'

export default function SearchSocieties() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Society[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      api
        .get('/societies/search', { params: { q } })
        .then(r => setResults(r.data.societies || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const select = (s: Society) => {
    localStorage.setItem('bhuid_selected_society', JSON.stringify(s))
    const prev: Society[] = JSON.parse(localStorage.getItem('bhuid_recent_society_searches') || '[]')
    localStorage.setItem(
      'bhuid_recent_society_searches',
      JSON.stringify([s, ...prev.filter(x => x.id !== s.id)].slice(0, 5))
    )
    navigate('/bank/homeowner-search')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Search Housing Societies</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Debounced live search across registered housing societies by name, city, state, address, or registration
          number.
        </p>
      </div>

      <div className="relative max-w-2xl">
        <Search size={18} className="absolute left-4 top-3.5 text-neutral-400" />
        <input
          className="input pl-11 py-3 text-base"
          placeholder="Enter society name, city, state, or registration number..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {loading && <div className="text-xs text-neutral-400">Searching society registry...</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {results.map(s => (
          <div key={s.id} className="card p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-bhuid-forest bg-bhuid-green/10 px-2.5 py-1 rounded">
                  {s.societyId}
                </span>
                {s.registrationNo && <span className="text-xs font-mono text-neutral-500">Reg: {s.registrationNo}</span>}
              </div>
              <h3 className="font-heading text-xl font-bold text-bhuid-green">{s.name}</h3>
              <div className="text-xs text-neutral-600 flex items-center gap-1.5">
                <MapPin size={13} className="text-bhuid-forest shrink-0" />
                <span>
                  {s.address}, {s.city}, {s.state} — {s.pincode}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <div className="text-xs text-neutral-500">
                {s.buildingsCount} Buildings · {s.totalFlats} Flats
              </div>
              <button className="btn btn-primary text-xs" onClick={() => select(s)}>
                Search Homeowners <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && results.length === 0 && (
        <div className="card p-10 text-center text-neutral-400 text-sm">No housing societies matched "{q}".</div>
      )}
    </div>
  )
}
