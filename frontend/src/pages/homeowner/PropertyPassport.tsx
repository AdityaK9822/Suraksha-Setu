import { useState, useEffect } from 'react'
import { ShieldCheck, FileText, Share2, Lock } from 'lucide-react'
import api from '../../services/api'
import type { HomeownerRecord, FlatInfo, Society } from '../../types'

interface PassportData {
  propertyId: string
  submissionStatus?: string
  homeowner?: HomeownerRecord
  flat?: FlatInfo
  society?: Society
  documentCount?: number
  propertyDocumentsCount?: number
  loanDocumentsCount?: number
  documentCategories?: string[]
  approvalRecords?: Array<{
    requestId: string
    bankName: string
    purpose: string
    societyDecision: string
    homeownerDecision: string
  }>
  sharingHistory?: Array<{
    bank: string
    grantId: string
    documentCount: number
    status: string
  }>
}

export default function PropertyPassport() {
  const [data, setData] = useState<{ passport: PassportData } | null>(null)
  useEffect(() => {
    api
      .get('/homeowner/passport')
      .then(r => setData(r.data))
      .catch(() => {})
  }, [])

  if (!data) return <div className="p-8 text-sm text-neutral-500">Generating Suraksha Setu Property Passport...</div>
  const p = data.passport

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-bhuid-forest bg-bhuid-green/10 px-3 py-1 rounded-full mb-2">
          <ShieldCheck size={14} />
          <span>Signature Suraksha Setu Credential</span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-bhuid-green">Suraksha Setu Property Passport</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Consolidated digital property identity record linking your homeowner profile, society membership, document
          locker categories, and two-key sharing audit log.
        </p>
      </div>

      {/* Signature Antique-Gold Framed Passport Card */}
      <div className="rounded-2xl overflow-hidden border-2 border-bhuid-gold shadow-2xl bg-white max-w-4xl">
        {/* Deep Green Passport Header */}
        <div className="bg-gradient-to-r from-bhuid-green to-bhuid-forest text-bhuid-ivory p-7 flex flex-wrap items-center justify-between gap-4 border-b-2 border-bhuid-gold">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-bhuid-gold/20 border border-bhuid-gold flex items-center justify-center">
              <span className="font-heading text-2xl font-extrabold text-bhuid-gold">S</span>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-bhuid-gold font-semibold">
                Suraksha Setu Digital Property Identity Passport
              </div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold mt-0.5">{p.propertyId}</div>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3.5 py-1.5 rounded-full bg-bhuid-gold text-bhuid-charcoal text-xs font-bold uppercase tracking-wider">
              {p.submissionStatus?.replace(/_/g, ' ')}
            </span>
            <div className="text-xs text-bhuid-ivory/75 mt-2">
              Society ID: <span className="font-mono">{p.society?.societyId}</span>
            </div>
          </div>
        </div>

        {/* Passport Body */}
        <div className="p-7 space-y-7 bg-gradient-to-b from-white to-bhuid-ivory/40">
          {/* Homeowner & Society Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
            <div className="p-4 rounded-xl bg-bhuid-ivory/70 border border-neutral-200/80">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                Registered Homeowner
              </div>
              <div className="font-heading font-bold text-bhuid-green text-base mt-1">{p.homeowner?.name}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{p.homeowner?.ownershipCategory}</div>
            </div>

            <div className="p-4 rounded-xl bg-bhuid-ivory/70 border border-neutral-200/80">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Flat &amp; Wing</div>
              <div className="font-heading font-bold text-bhuid-green text-base mt-1">
                {p.flat?.wing ? `Wing ${p.flat.wing} · ` : ''}Flat {p.flat?.flatNumber}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">{p.society?.name}</div>
            </div>

            <div className="p-4 rounded-xl bg-bhuid-ivory/70 border border-neutral-200/80">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Location</div>
              <div className="font-heading font-bold text-bhuid-green text-base mt-1">
                {p.society?.city}, {p.society?.state}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">PIN: {p.society?.pincode}</div>
            </div>

            <div className="p-4 rounded-xl bg-bhuid-ivory/70 border border-neutral-200/80">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Vault Summary</div>
              <div className="font-heading font-bold text-bhuid-green text-base mt-1">{p.documentCount} Documents</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {p.propertyDocumentsCount || 0} Property · {p.loanDocumentsCount || 0} Loan
              </div>
            </div>
          </div>

          {/* Document Categories On File */}
          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-bhuid-green mb-3 flex items-center gap-2">
              <FileText size={16} className="text-bhuid-forest" />
              <span>Document Categories On File</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {p.documentCategories?.length ? (
                p.documentCategories.map(c => (
                  <span
                    key={c}
                    className="px-3 py-1.5 rounded-lg bg-bhuid-green/10 text-bhuid-green text-xs font-semibold border border-bhuid-green/20"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-neutral-400 italic">No documents uploaded yet.</span>
              )}
            </div>
          </div>

          {/* Two-Key Approval & Sharing History */}
          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
            <div>
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-bhuid-green mb-3 flex items-center gap-2">
                <Lock size={15} className="text-bhuid-forest" />
                <span>Two-Key Approval Records</span>
              </h3>
              {p.approvalRecords && p.approvalRecords.length > 0 ? (
                <div className="space-y-2">
                  {p.approvalRecords.map(a => (
                    <div key={a.requestId} className="p-3 rounded-lg bg-white border border-neutral-200 text-xs">
                      <div className="flex justify-between font-semibold text-bhuid-green">
                        <span>{a.bankName}</span>
                        <span className="font-mono">{a.requestId}</span>
                      </div>
                      <div className="text-neutral-500 mt-0.5">Purpose: {a.purpose}</div>
                      <div className="text-[11px] text-neutral-500 mt-1">
                        Key 1 (Society): <strong>{a.societyDecision}</strong> · Key 2 (Owner):{' '}
                        <strong>{a.homeownerDecision}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400 italic">No bank verification requests recorded yet.</p>
              )}
            </div>

            <div>
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-bhuid-green mb-3 flex items-center gap-2">
                <Share2 size={15} className="text-bhuid-forest" />
                <span>Controlled Sharing Grants</span>
              </h3>
              {p.sharingHistory && p.sharingHistory.length > 0 ? (
                <div className="space-y-2">
                  {p.sharingHistory.map((g, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-white border border-neutral-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-bhuid-green">{g.bank}</div>
                        <div className="text-neutral-500">
                          Grant <span className="font-mono">{g.grantId}</span> · {g.documentCount} docs shared
                        </div>
                      </div>
                      <span className={`badge ${g.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                        {g.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400 italic">No active or past sharing grants.</p>
              )}
            </div>
          </div>

          {/* Mandatory Non-Title Disclaimer */}
          <div className="p-4 rounded-xl bg-bhuid-ivory border border-bhuid-gold/50 text-xs text-bhuid-charcoal/80 leading-relaxed">
            <strong>Statutory Notice:</strong> The Suraksha Setu Property Passport is a digital property record-organisation and
            consent-tracking credential. It does not constitute a government-issued ownership certificate, sub-registrar
            title deed, or legal encumbrance clearance.
          </div>
        </div>
      </div>
    </div>
  )
}
