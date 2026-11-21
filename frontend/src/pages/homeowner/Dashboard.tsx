import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Upload, ArrowRight, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import type { HomeownerRecord, FlatInfo, PropertyRecord, ActivityRecord } from '../../types'

interface HomeownerDashboardData {
  homeowner?: HomeownerRecord
  flat?: FlatInfo
  property?: PropertyRecord
  stats?: {
    docCount?: number
    propertyDocCount?: number
    loanDocCount?: number
    pendingDocs?: number
    bankReqs?: number
    activeGrants?: number
  }
  recent?: ActivityRecord[]
}

export default function HomeownerDashboard() {
  const [data, setData] = useState<HomeownerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/homeowner/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-sm text-neutral-500">Loading homeowner dashboard...</div>

  if (!data?.homeowner) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto space-y-4">
        <h1 className="font-heading text-2xl font-bold text-bhuid-green">Homeowner Profile Pending Society Link</h1>
        <p className="text-sm text-neutral-600">
          Your user account is active, but your Society Admin has not yet linked this email address to a flat in the
          society registry.
        </p>
      </div>
    )
  }

  const s = data.stats || {}
  const h = data.homeowner
  const flat = data.flat
  const prop = data.property

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-bhuid-forest bg-bhuid-green/10 px-3 py-1 rounded-full mb-2">
            <span>Property ID: {prop?.propertyId || 'PROP-LINKED'}</span>
            <span>· {h.ownershipCategory || 'Primary Owner'}</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-bhuid-green">{h.name}</h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            {h.society?.name} · {flat?.wing ? `Wing ${flat.wing} · ` : ''}Flat {flat?.flatNumber} ·{' '}
            {h.society?.address}, {h.society?.city}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/homeowner/passport" className="btn btn-gold text-xs sm:text-sm font-semibold">
            <CreditCard size={16} /> View Property Passport
          </Link>
          <Link to="/homeowner/upload" className="btn btn-primary text-xs sm:text-sm">
            <Upload size={16} /> Upload Documents
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-bhuid-gold">
          <div className="text-xs font-medium text-neutral-500">Property Passport Status</div>
          <div className="text-lg font-heading font-bold text-bhuid-green mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 size={18} className="text-bhuid-forest" />
            <span>{(s.docCount || 0) > 0 ? 'Records Active' : 'Awaiting Docs'}</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">{prop?.propertyId || 'Linked to Society'}</div>
        </div>

        <div className="card p-5 border-l-4 border-l-bhuid-green">
          <div className="text-xs font-medium text-neutral-500">Uploaded Documents</div>
          <div className="text-3xl font-heading font-bold text-bhuid-green mt-1">{s.docCount}</div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {s.propertyDocCount || 0} Property · {s.loanDocCount || 0} Loan
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-neutral-400">
          <div className="text-xs font-medium text-neutral-500">Pending Review Documents</div>
          <div className="text-3xl font-heading font-bold text-bhuid-charcoal mt-1">{s.pendingDocs}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Under society verification</div>
        </div>

        <div className="card p-5 border-l-4 border-l-bhuid-forest">
          <div className="text-xs font-medium text-neutral-500">Pending Bank Requests</div>
          <div className="text-3xl font-heading font-bold text-bhuid-green mt-1">{s.bankReqs}</div>
          <div className="text-[11px] text-bhuid-forest font-medium mt-1">
            {s.activeGrants || 0} active sharing grants
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/homeowner/passport" className="card p-6 hover:border-bhuid-gold transition group">
          <div className="text-xs uppercase tracking-widest text-bhuid-gold font-bold">Signature Record</div>
          <h3 className="font-heading text-xl font-bold text-bhuid-green mt-1 group-hover:text-bhuid-forest">
            Suraksha Setu Property Passport →
          </h3>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            Inspect your digital property identity card, document categories on file, and complete sharing audit trail.
          </p>
        </Link>

        <Link to="/homeowner/documents" className="card p-6 hover:border-bhuid-forest transition group">
          <div className="text-xs uppercase tracking-widest text-bhuid-forest font-bold">Private Vault</div>
          <h3 className="font-heading text-xl font-bold text-bhuid-green mt-1">
            Document Locker ({s.docCount}) →
          </h3>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            Preview, download, or upload new versions of your sale deed, share certificate, tax receipts, and loan
            records.
          </p>
        </Link>

        <Link to="/homeowner/consent" className="card p-6 hover:border-bhuid-forest transition group">
          <div className="text-xs uppercase tracking-widest text-bhuid-forest font-bold">Two-Key Control</div>
          <h3 className="font-heading text-xl font-bold text-bhuid-green mt-1">
            Consent Management ({s.bankReqs}) →
          </h3>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            Review society-approved bank requests and choose the exact documents to disclose under time-bound grants.
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-bhuid-green">Recent Property &amp; Locker Activity</h2>
          <Link to="/homeowner/activity" className="text-xs text-bhuid-forest hover:underline flex items-center gap-1">
            View All <ArrowRight size={13} />
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {(data.recent || []).map(a => (
              <tr key={a.id}>
                <td className="font-mono text-xs font-semibold text-bhuid-green">{a.action}</td>
                <td className="text-xs text-neutral-600">{a.entity}</td>
                <td className="text-xs text-neutral-500">{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
