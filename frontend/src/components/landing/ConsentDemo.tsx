import { useEffect, useState, type ReactNode } from 'react'
import LandingButton from './LandingButton'

/**
 * Frontend-only simulation of the consent workflow. It enforces nothing: it exists to
 * let a visitor play all three roles and see how access opens and closes.
 */

const STORAGE_KEY = 'ss_demo'
const STATES = ['idle', 'pend_soc', 'pend_own', 'granted', 'rejected', 'revoked'] as const
type ConsentState = (typeof STATES)[number]

const REQUESTED_DOCS = ['Sale agreement', 'Index II', 'Bank loan statement']

function isConsentState(value: unknown): value is ConsentState {
  return typeof value === 'string' && (STATES as readonly string[]).includes(value)
}

/** Reads the saved state, ignoring anything missing, corrupt or unexpected. */
function loadState(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null && 'st' in parsed) {
        const saved = (parsed as { st: unknown }).st
        if (isConsentState(saved)) return saved
      }
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return 'idle'
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="mb-3 inline-block bg-bhuid-gold px-[9px] py-[3px] text-xs font-semibold text-bhuid-green">
      {children}
    </span>
  )
}

function Text({ children }: { children: ReactNode }) {
  return <p className="m-0 mb-3.5 text-sm leading-normal">{children}</p>
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-[210px] border-t-[3px] border-bhuid-green bg-white p-[22px] shadow-[0_14px_34px_rgba(18,60,50,0.1)]">
      <h3 className="m-0 mb-3.5 font-heading text-sm tracking-[.2em] text-bhuid-forest">{title}</h3>
      <div aria-live="polite">{children}</div>
    </div>
  )
}

const actions = 'flex flex-wrap gap-2'

export default function ConsentDemo() {
  const [state, setState] = useState<ConsentState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ st: state }))
    } catch {
      /* storage unavailable: the demo still works, it just will not persist */
    }
  }, [state])

  const bank = (() => {
    switch (state) {
      case 'idle':
        return (
          <>
            <Text>Request: {REQUESTED_DOCS.join(', ')}. Purpose: home-loan verification. Expiry: 7 days.</Text>
            <LandingButton primary tone="light" size="sm" onClick={() => setState('pend_soc')}>
              Submit request
            </LandingButton>
          </>
        )
      case 'granted':
        return (
          <>
            <Pill>ACCESS GRANTED · 7 days</Pill>
            {REQUESTED_DOCS.map(doc => (
              <div key={doc} className="mb-1.5 flex justify-between bg-bhuid-ivory px-3 py-[9px] text-[13px]">
                {doc}
                <span>view</span>
              </div>
            ))}
          </>
        )
      case 'rejected':
        return (
          <>
            <Pill>REJECTED</Pill>
            <Text>No documents are accessible.</Text>
            <LandingButton tone="light" size="sm" onClick={() => setState('idle')}>
              Reset
            </LandingButton>
          </>
        )
      case 'revoked':
        return (
          <>
            <Pill>REVOKED / EXPIRED</Pill>
            <Text>Access has ended. Documents are hidden.</Text>
            <LandingButton tone="light" size="sm" onClick={() => setState('idle')}>
              Reset
            </LandingButton>
          </>
        )
      default:
        return (
          <>
            <Pill>{state === 'pend_soc' ? 'AWAITING SOCIETY' : 'AWAITING HOMEOWNER'}</Pill>
            <Text>
              No documents are visible yet.{' '}
              {state === 'pend_own' ? 'Society approval alone never exposes documents.' : ''}
            </Text>
          </>
        )
    }
  })()

  const society = (() => {
    switch (state) {
      case 'pend_soc':
        return (
          <>
            <Text>Bank request received for {REQUESTED_DOCS.length} documents.</Text>
            <div className={actions}>
              <LandingButton primary tone="light" size="sm" onClick={() => setState('pend_own')}>
                Approve
              </LandingButton>
              <LandingButton tone="light" size="sm" onClick={() => setState('rejected')}>
                Reject
              </LandingButton>
            </div>
          </>
        )
      case 'idle':
        return <Text>No pending bank requests.</Text>
      default: {
        const status = state === 'pend_own' ? 'approved, awaiting homeowner' : state === 'granted' ? 'approved' : state
        return <Text>Request handled. Status: {status}.</Text>
      }
    }
  })()

  const homeowner = (() => {
    switch (state) {
      case 'pend_own':
        return (
          <>
            <Text>
              Society approved. Do you consent to share these {REQUESTED_DOCS.length} documents for 7 days?
            </Text>
            <div className={actions}>
              <LandingButton primary tone="light" size="sm" onClick={() => setState('granted')}>
                Consent
              </LandingButton>
              <LandingButton tone="light" size="sm" onClick={() => setState('rejected')}>
                Reject
              </LandingButton>
            </div>
          </>
        )
      case 'granted':
        return (
          <>
            <Text>You have an active grant.</Text>
            <LandingButton tone="light" size="sm" onClick={() => setState('revoked')}>
              Revoke access
            </LandingButton>
          </>
        )
      case 'idle':
        return <Text>Nothing awaiting your consent.</Text>
      default:
        return <Text>No active grants.</Text>
    }
  })()

  return (
    <div className="mt-[5vh] grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
      <Column title="BANK">{bank}</Column>
      <Column title="SOCIETY ADMIN">{society}</Column>
      <Column title="HOMEOWNER">{homeowner}</Column>
    </div>
  )
}
