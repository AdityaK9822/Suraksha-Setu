import { useState, useEffect } from 'react'
import { Home, Building2, Users } from 'lucide-react'
import api from '../../services/api'
import type { PropertyRecord, FlatInfo, Society, HomeownerRecord } from '../../types'

interface MyPropertyData {
  property?: PropertyRecord
  flat?: FlatInfo
  society?: Society
  homeowner?: HomeownerRecord
}

export default function MyProperty() {
  const [data, setData] = useState<MyPropertyData | null>(null)
  useEffect(() => {
    api
      .get('/homeowner/property')
      .then(r => setData(r.data))
      .catch(() => {})
  }, [])

  if (!data) return <div className="p-8 text-sm text-neutral-500">Loading property record...</div>

  const { property, flat, society, homeowner } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">My Property</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Verified society flat linkage, property identifier, and co-ownership details.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4 border-t-4 border-t-bhuid-green">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <Home size={18} className="text-bhuid-green" />
            <h2 className="font-heading text-lg font-bold text-bhuid-green">Unit &amp; Ownership Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-neutral-500">Unique Property ID</div>
              <div className="font-mono font-bold text-bhuid-green mt-0.5">{property?.propertyId || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Ownership Category</div>
              <div className="font-semibold mt-0.5">{homeowner?.ownershipCategory || 'Primary Owner'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Building / Wing</div>
              <div className="font-semibold mt-0.5">{flat?.building?.name || `Wing ${flat?.wing || 'A'}`}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Flat Number</div>
              <div className="font-mono font-bold mt-0.5">{flat?.flatNumber || '—'}</div>
            </div>
          </div>

          {flat?.homeowners && flat.homeowners.length > 0 && (
            <div className="pt-3 border-t border-neutral-100">
              <div className="text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-1.5">
                <Users size={14} /> Associated Flat Holders
              </div>
              <div className="space-y-1.5">
                {flat.homeowners.map(a => (
                  <div
                    key={a.id}
                    className="text-xs flex items-center justify-between bg-bhuid-ivory/60 px-3 py-2 rounded-lg"
                  >
                    <span className="font-semibold text-bhuid-green">{a.homeowner?.name}</span>
                    <span className="badge badge-gold">{a.homeowner?.ownershipCategory || 'Owner'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4 border-t-4 border-t-bhuid-gold">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <Building2 size={18} className="text-bhuid-green" />
            <h2 className="font-heading text-lg font-bold text-bhuid-green">Cooperative Housing Society</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-neutral-500">Society Name</div>
              <div className="font-semibold text-bhuid-green mt-0.5">{society?.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-neutral-500">Society ID</div>
                <div className="font-mono font-semibold mt-0.5">{society?.societyId}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Registration No.</div>
                <div className="font-mono font-semibold mt-0.5">{society?.registrationNo || '—'}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Full Property Address</div>
              <div className="font-medium mt-0.5">
                Flat {flat?.wing ? `${flat.wing}-` : ''}
                {flat?.flatNumber}, {society?.name}, {society?.address}, {society?.city}, {society?.state} —{' '}
                {society?.pincode}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
