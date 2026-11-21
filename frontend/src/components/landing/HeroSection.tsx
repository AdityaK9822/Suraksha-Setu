import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import LandingButton from './LandingButton'
import { cl, ez } from './heroMath'

gsap.registerPlugin(ScrollTrigger)

// three.js is heavy, so keep it out of the initial bundle.
const HeroScene = lazy(() => import('./HeroScene'))

/** Static stand-in shown while the 3D scene loads, or if WebGL is unavailable. */
function HeroFallback() {
  const card = 'h-[175px] w-[130px] rounded-md border-t-[6px] border-bhuid-gold bg-bhuid-ivory p-3 font-heading text-[10px] font-bold tracking-[.08em] text-bhuid-green shadow-[0_16px_34px_rgba(0,0,0,0.35)]'
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_65%_42%,#1d5747_0%,#123C32_68%)]"
    >
      <div className="relative flex h-[min(300px,54vw)] w-[min(420px,78vw)] flex-col justify-between rounded-2xl border border-bhuid-gold/45 bg-[linear-gradient(145deg,#246854,#143f34)] p-7 shadow-[0_35px_80px_rgba(0,0,0,0.45)]">
        <div className="font-heading text-[28px] font-extrabold tracking-[.18em] text-bhuid-gold">SURAKSHA SETU</div>
        <div className="absolute -right-6 -top-9 flex gap-3">
          <div className={`${card} -rotate-[8deg]`}>
            INDEX II
            <div className="mt-3 h-1 bg-bhuid-green" />
          </div>
          <div className={`${card} -translate-y-2.5 rotate-6`}>
            SALE DEED
            <div className="mt-3 h-1 bg-bhuid-green" />
          </div>
        </div>
        <div className="text-xs tracking-[.22em] text-bhuid-ivory/85">PROPERTY RECORD LOCKER · CONSENT VERIFIED</div>
      </div>
    </div>
  )
}

/** Catches WebGL / three.js failures so the rest of the page keeps working. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function HeroSection() {
  const reduced = useReducedMotion() ?? false

  const rootRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  /** Smoothed scroll progress (0..1). Read by the 3D scene every frame, so it lives in a ref. */
  const progress = useRef(reduced ? 1 : 0)
  const [inView, setInView] = useState(true)

  // Scroll progress -> smoothed value -> hero copy and 3D scene.
  useEffect(() => {
    const root = rootRef.current
    const heading = headingRef.current
    const sub = subRef.current
    const cta = ctaRef.current
    const hint = hintRef.current
    if (!root || !heading || !sub || !cta || !hint) return

    const apply = (p: number) => {
      const c = ez(cl((p - 0.78) / 0.18))
      heading.style.opacity = String(c)
      heading.style.transform = `translateY(${(1 - c) * 30}px)`
      sub.style.opacity = String(c)
      cta.style.opacity = String(c)
      cta.style.pointerEvents = c > 0.2 ? 'auto' : 'none'
      hint.style.opacity = String(0.7 * (1 - cl(p / 0.1)))
    }

    if (reduced) {
      progress.current = 1
      apply(1)
      return
    }

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    })

    // Start from the real scroll position, e.g. after a reload part-way down the page.
    progress.current = trigger.progress
    apply(progress.current)

    const tick = (_time: number, deltaTime: number) => {
      const target = trigger.progress
      // Frame-rate independent version of "move 8% of the way per frame at 60fps".
      const k = 1 - Math.pow(0.92, deltaTime / (1000 / 60))
      progress.current += (target - progress.current) * k
      apply(progress.current)
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      trigger.kill()
    }
  }, [reduced])

  // Pause rendering while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  return (
    <div id="hero" ref={rootRef} className="relative h-[400vh] bg-bhuid-green motion-reduce:h-screen">
      <div className="sticky top-0 h-screen overflow-hidden supports-[height:100svh]:h-[100svh]">
        <div
          className="absolute inset-0"
          role="img"
          aria-label="3D deep-green property folder with documents flying out"
        >
          <SceneBoundary fallback={<HeroFallback />}>
            <Suspense fallback={<HeroFallback />}>
              <HeroScene progress={progress} active={inView} reducedMotion={reduced} />
            </Suspense>
          </SceneBoundary>
        </div>

        <div
          ref={hintRef}
          aria-hidden="true"
          className="absolute left-1/2 top-[84px] -translate-x-1/2 text-center text-[11px] tracking-[.3em] text-bhuid-ivory opacity-70"
        >
          SCROLL
          <i className="mx-auto mt-2.5 block h-[38px] w-px bg-bhuid-gold animate-scroll-line motion-reduce:animate-none" />
        </div>

        <div className="pointer-events-none absolute inset-x-[5vw] bottom-[9vh] text-bhuid-ivory [&>*]:pointer-events-auto">
          <div className="mb-4 font-heading text-xs font-medium tracking-[.4em] text-bhuid-gold">SURAKSHA SETU</div>
          <h1
            ref={headingRef}
            className="m-0 translate-y-[30px] font-heading text-[clamp(34px,6.4vw,88px)] font-extrabold leading-[.98] tracking-[-0.03em] opacity-0 [text-shadow:0_8px_28px_rgba(0,0,0,0.35)]"
          >
            Your Property.
            <br />
            Your Documents.
            <br />
            Your Peace of Mind.
          </h1>
          <p
            ref={subRef}
            className="mb-[26px] mt-5 max-w-[520px] text-[clamp(14px,1.3vw,17px)] leading-[1.6] text-[#d9d6c9] opacity-0"
          >
            One trusted space to organise property records, connect housing societies and securely share authorised
            information with financial institutions.
          </p>
          <div ref={ctaRef} className="flex flex-wrap gap-3.5 opacity-0">
            <LandingButton primary href="#demo">
              Explore Suraksha Setu
            </LandingButton>
            <LandingButton href="#how">Explore the Platform</LandingButton>
          </div>
        </div>
      </div>
    </div>
  )
}
