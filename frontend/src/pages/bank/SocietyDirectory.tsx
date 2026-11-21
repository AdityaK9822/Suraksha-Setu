import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import type { Society } from '../../types'

export default function SocietyDirectory() {
  const [list, setList] = useState<Society[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/societies')
      .then(r => setList(r.data.societies || []))
      .catch(() => {})
  }, [])

  const select = (s: Society) => {
    localStorage.setItem('bhuid_selected_society', JSON.stringify(s))
    navigate('/bank/homeowner-search')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Registered Society Directory</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Select any society to search its permitted homeowner directory.
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Society ID</th>
              <th>Society Name</th>
              <th>Registration No.</th>
              <th>City &amp; State</th>
              <th>Flats</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id}>
                <td className="font-mono text-xs font-bold text-bhuid-forest">{s.societyId}</td>
                <td className="font-semibold text-bhuid-green">{s.name}</td>
                <td className="font-mono text-xs">{s.registrationNo || '—'}</td>
                <td>
                  {s.city}, {s.state} ({s.pincode})
                </td>
                <td>{s.totalFlats}</td>
                <td>
                  <button className="btn btn-primary py-1.5 px-3 text-xs" onClick={() => select(s)}>
                    Select Society →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
