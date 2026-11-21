import { useState, useEffect } from 'react'
import api from '../../services/api'
import type { Society } from '../../types'

export default function SocietyProfile() {
  const [society, setSociety] = useState<Society | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    api
      .get('/society-admin/me')
      .then(r => setSociety(r.data.society))
      .catch(e => setErr(e?.response?.data?.error || 'No society found'))
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <div className="p-8 text-center text-neutral-500">Loading...</div>
  if (err || !society)
    return (
      <div className="p-8">
        <div className="card p-6 text-center">
          <h2 className="font-heading text-xl text-bhuid-green mb-2">No society</h2>
          <p className="text-neutral-500 text-sm">{err || 'Create a society first.'}</p>
          <a href="/society/create" className="btn btn-primary mt-4 inline-block">
            Create Society
          </a>
        </div>
      </div>
    )
  return (
    <div>
      <h1 className="font-heading text-3xl text-bhuid-green mb-6">Society Profile</h1>
      <div className="card p-6 space-y-3">
        <div>
          <span className="font-semibold">Society ID:</span> {society.societyId}
        </div>
        <div>
          <span className="font-semibold">Name:</span> {society.name}
        </div>
        <div>
          <span className="font-semibold">Registration No:</span> {society.registrationNo || '—'}
        </div>
        <div>
          <span className="font-semibold">Address:</span> {society.address}, {society.city}, {society.state} -{' '}
          {society.pincode}
        </div>
        <div>
          <span className="font-semibold">Buildings:</span> {society.buildingsCount} &nbsp;{' '}
          <span className="font-semibold">Total Flats:</span> {society.totalFlats}
        </div>
        <div>
          <span className="font-semibold">Contact:</span> {society.contactEmail} {society.contactPhone}
        </div>
      </div>
    </div>
  )
}
