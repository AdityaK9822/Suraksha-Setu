import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, UserCog, PlusCircle, ArrowRight } from 'lucide-react'
import api from '../../services/api'
import type { Society, OfficeBearer, ActivityRecord } from '../../types'

interface SocietyDashboardData {
  society?: Society
  officeBearers?: OfficeBearer[]
  stats?: {
    homeowners?: number
    flats?: number
    pendingRegs?: number
    pendingBankReqs?: number
    docs?: number
    acceptedDocs?: number
  }
  recent?: ActivityRecord[]
}

export default function SocietyDashboard() {
  const [data, setData] = useState<SocietyDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/society-admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-sm text-neutral-500">Loading society overview...</div>

  if (!data?.society) {
    return (
      <div className="card p-10 text-center max-w-2xl mx-auto space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-bhuid-green text-bhuid-gold mx-auto flex items-center justify-center">
          <Building2 size={30} />
        </div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Initialize Your Housing Society</h1>
        <p className="text-sm text-neutral-600 max-w-lg mx-auto">
          Welcome to the Suraksha Setu Society Admin Portal. Start by creating your society profile and registering your main
          Office Bearers (Chairman, Secretary, and Treasurer).
        </p>
        <Link to="/society/create" className="btn btn-primary">
          <PlusCircle size={18} /> Create Housing Society
        </Link>
      </div>
    )
  }

  const s = data.stats || {}
  const soc = data.society
  const bearers = data.officeBearers || []

  return (
    <div className="space-y-8">
      {/* Top Society Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-bhuid-forest bg-bhuid-green/10 px-3 py-1 rounded-full mb-2">
            <span>Society ID: {soc.societyId}</span>
            {soc.registrationNo && <span>· Reg: {soc.registrationNo}</span>}
          </div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">{soc.name}</h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            {soc.address}, {soc.city}, {soc.state} — {soc.pincode}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/society/register-homeowners" className="btn btn-primary text-xs sm:text-sm">
            + Register Homeowner
          </Link>
          <Link to="/society/bank-requests" className="btn btn-outline text-xs sm:text-sm">
            Review Bank Requests ({s.pendingBankReqs || 0})
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-5 border-l-4 border-l-bhuid-green">
          <div className="text-xs font-medium text-neutral-500">Registered Homeowners</div>
          <div className="text-3xl font-heading font-bold text-bhuid-green mt-1">{s.homeowners}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Active resident profiles</div>
        </div>
        <div className="card p-5 border-l-4 border-l-bhuid-forest">
          <div className="text-xs font-medium text-neutral-500">Total Society Flats</div>
          <div className="text-3xl font-heading font-bold text-bhuid-green mt-1">{s.flats}</div>
          <div className="text-[11px] text-neutral-400 mt-1">{soc.buildingsCount} buildings / wings</div>
        </div>
        <div className="card p-5 border-l-4 border-l-neutral-400">
          <div className="text-xs font-medium text-neutral-500">Pending Registrations</div>
          <div className="text-3xl font-heading font-bold text-bhuid-charcoal mt-1">{s.pendingRegs}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Awaiting activation</div>
        </div>
        <div className="card p-5 border-l-4 border-l-bhuid-gold">
          <div className="text-xs font-medium text-neutral-500">Pending Bank Requests</div>
          <div className="text-3xl font-heading font-bold text-bhuid-green mt-1">{s.pendingBankReqs}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Requires Key-1 decision</div>
        </div>
        <div className="card p-5 border-l-4 border-l-emerald-600">
          <div className="text-xs font-medium text-neutral-500">Documents Submitted</div>
          <div className="text-3xl font-heading font-bold text-bhuid-green mt-1">{s.docs}</div>
          <div className="text-[11px] text-emerald-700 mt-1">{s.acceptedDocs || 0} accepted for purpose</div>
        </div>
      </div>

      {/* Society Info + Main Members (Chairman, Secretary, Treasurer) Boxes */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Building2 size={18} className="text-bhuid-green" />
              <h2 className="font-heading text-lg font-bold text-bhuid-green">Society Profile Summary</h2>
            </div>
            <Link to="/society/create" className="text-xs text-bhuid-forest font-medium hover:underline">
              Edit Details
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-bhuid-ivory/60">
              <div className="text-neutral-500">Society ID</div>
              <div className="font-mono font-bold text-bhuid-green mt-0.5">{soc.societyId}</div>
            </div>
            <div className="p-3 rounded-lg bg-bhuid-ivory/60">
              <div className="text-neutral-500">Registration No.</div>
              <div className="font-mono font-semibold text-bhuid-charcoal mt-0.5">{soc.registrationNo || '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-bhuid-ivory/60">
              <div className="text-neutral-500">Contact Email</div>
              <div className="font-medium text-bhuid-charcoal mt-0.5 truncate">{soc.contactEmail || '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-bhuid-ivory/60">
              <div className="text-neutral-500">Contact Phone</div>
              <div className="font-medium text-bhuid-charcoal mt-0.5">{soc.contactPhone || '—'}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <UserCog size={18} className="text-bhuid-green" />
              <h2 className="font-heading text-lg font-bold text-bhuid-green">
                Authorised Office Bearers (Chairman · Secretary · Treasurer)
              </h2>
            </div>
            <Link to="/society/office-bearers" className="text-xs text-bhuid-forest font-medium hover:underline">
              Manage Bearers →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {['Chairman', 'Secretary', 'Treasurer'].map(roleName => {
              const ob = bearers.find(b => b.designation === roleName)
              return (
                <div
                  key={roleName}
                  className="p-4 rounded-xl bg-bhuid-ivory/70 border border-neutral-200/80 space-y-1"
                >
                  <span className="badge badge-gold text-[10px] uppercase tracking-wider">{roleName}</span>
                  {ob ? (
                    <>
                      <div className="font-heading font-bold text-sm text-bhuid-green pt-1">{ob.name}</div>
                      <div className="text-xs text-neutral-500 truncate">{ob.email}</div>
                      <div className="text-[11px] text-neutral-400">{ob.phone || 'Authorised Signatory'}</div>
                    </>
                  ) : (
                    <div className="pt-2">
                      <div className="text-xs text-neutral-400 italic">Not assigned yet</div>
                      <Link
                        to="/society/office-bearers"
                        className="text-xs text-bhuid-forest underline font-medium"
                      >
                        + Assign {roleName}
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-bhuid-green">Recent Society Administrative Activity</h2>
          <Link to="/society/activity" className="text-xs text-bhuid-forest hover:underline flex items-center gap-1">
            Full Audit Log <ArrowRight size={13} />
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {(data.recent || []).map(a => (
              <tr key={a.id}>
                <td className="font-mono text-xs font-semibold text-bhuid-green">{a.action}</td>
                <td className="text-xs text-neutral-600">{a.entity || 'System'}</td>
                <td className="text-xs text-neutral-500 font-mono truncate max-w-xs">{a.metadata || '—'}</td>
                <td className="text-xs text-neutral-500">{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {(!data.recent || data.recent.length === 0) && (
              <tr>
                <td colSpan={4} className="text-center text-neutral-400 py-6">
                  No recent activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
