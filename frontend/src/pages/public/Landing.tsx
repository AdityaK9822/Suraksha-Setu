import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll } from 'framer-motion'
import HeroSection from '../../components/landing/HeroSection'
import NetworkDiagram from '../../components/landing/NetworkDiagram'
import ConsentDemo from '../../components/landing/ConsentDemo'
import LandingButton from '../../components/landing/LandingButton'
import Reveal from '../../components/landing/Reveal'

const NAV_LINKS = [
  { href: '#problem', label: 'The problem' },
  { href: '#how', label: 'How it works' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#demo', label: 'Try the demo' },
]

const PROBLEMS = [
  { numeral: 'i', text: 'Property documents are scattered across physical files and digital folders.' },
  { numeral: 'ii', text: 'Homeowners struggle to organise important records.' },
  { numeral: 'iii', text: 'Housing societies manage fragmented member information.' },
  { numeral: 'iv', text: 'Banks need authorised access to relevant documents.' },
  { numeral: 'v', text: 'Sharing documents without clear consent creates privacy concerns.' },
]

const STEPS = [
  {
    title: 'Society registers its community',
    text: 'Buildings, flats and office bearers are set up once, creating a trusted directory.',
  },
  {
    title: 'Homeowners organise their records',
    text: 'Property, loan and society documents are uploaded and categorised in one workspace.',
  },
  {
    title: 'Banks request specific documents',
    text: 'A request names the documents, the purpose and an expiry date.',
  },
  {
    title: 'Society authorisation and homeowner consent',
    text: 'Access opens only when both approve, and only for the time requested.',
  },
]

const PRIVACY_POINTS = [
  { title: 'Specific requests', text: 'Banks ask for named documents, never blanket access.' },
  { title: 'Two approvals', text: 'Society approval and homeowner consent are separate steps.' },
  { title: 'Time-limited', text: 'Every grant carries an expiry and then closes.' },
  { title: 'Transparent history', text: 'Each request, approval and view is logged for everyone involved.' },
  { title: 'Future control', text: 'Homeowners can revoke access whenever they choose.' },
]

const FOOTER_LINK = 'mb-2 mr-5 inline-block text-inherit no-underline hover:text-bhuid-gold'

function SectionLabel({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <Reveal className={`mb-[22px] font-heading text-xs font-medium tracking-[.35em] ${onDark ? 'text-bhuid-gold' : 'text-bhuid-forest'}`}>
      {children}
    </Reveal>
  )
}

/** Gold line that draws down the timeline as the section scrolls past. */
function Timeline() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] })

  return (
    <div ref={ref} className="relative ml-1 mt-[8vh] max-w-[760px] pl-[46px]">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-bhuid-charcoal/20" />
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-0.5 origin-top bg-bhuid-gold"
        style={{ scaleY: reduced ? 1 : scrollYProgress }}
      />
      {STEPS.map((step, i) => (
        <Reveal
          key={step.title}
          data-n={i + 1}
          className="relative mb-16 before:absolute before:-left-[70px] before:-top-1 before:grid before:h-[46px] before:w-[46px] before:place-items-center before:bg-bhuid-ivory before:font-heading before:text-lg before:font-extrabold before:text-bhuid-forest before:content-[attr(data-n)] max-[700px]:before:-left-[62px]"
        >
          <h3 className="m-0 mb-2 font-heading text-2xl tracking-[-0.03em]">{step.title}</h3>
          <p className="m-0 leading-[1.6] text-[#4a524f]">{step.text}</p>
        </Reveal>
      ))}
    </div>
  )
}

export default function Landing() {
  const sectionPad = 'relative px-[5vw] py-[14vh]'
  const h2Base = 'm-0 font-heading font-extrabold tracking-[-0.03em]'

  return (
    <div className="overflow-x-clip bg-bhuid-ivory font-body text-bhuid-charcoal">
      <nav className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-bhuid-gold/15 bg-bhuid-green/60 px-[5vw] pb-[18px] pt-[max(18px,env(safe-area-inset-top))] text-bhuid-ivory backdrop-blur-[10px]">
        <a href="#hero" className="font-heading text-[15px] font-extrabold tracking-[.28em] text-inherit no-underline">
          SURAKSHA SETU
        </a>
        <div className="flex items-center gap-6 text-[13px]">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="hidden text-inherit no-underline opacity-85 transition hover:text-bhuid-gold hover:opacity-100 min-[701px]:inline"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/login"
            className="border border-bhuid-gold px-3.5 py-1.5 text-inherit no-underline transition hover:bg-bhuid-gold hover:text-bhuid-green"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <HeroSection />

      <section id="problem" className={sectionPad}>
        <SectionLabel>01 · THE PROBLEM</SectionLabel>
        <Reveal>
          <h2 className={`${h2Base} max-w-[900px] text-[clamp(34px,6vw,84px)] leading-none`}>
            Property records shouldn’t be{' '}
            <em className="bg-[linear-gradient(transparent_62%,rgba(213,180,119,.55)_0)] not-italic text-bhuid-forest">
              difficult to find.
            </em>
          </h2>
        </Reveal>
        <div className="mt-[9vh] grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] border-t border-bhuid-charcoal">
          {PROBLEMS.map(item => (
            <Reveal
              key={item.numeral}
              className="border-b border-bhuid-charcoal/20 pb-[30px] pr-6 pt-[26px] text-base leading-[1.55]"
            >
              <span className="mb-2.5 block font-heading text-[44px] font-light text-bhuid-gold">{item.numeral}</span>
              {item.text}
            </Reveal>
          ))}
        </div>
      </section>

      <section className={`${sectionPad} overflow-hidden bg-bhuid-forest text-bhuid-ivory`}>
        <SectionLabel onDark>02 · THE SOLUTION</SectionLabel>
        <Reveal>
          <h2 className={`${h2Base} max-w-[800px] text-[clamp(30px,5vw,68px)]`}>
            One connection. Three stakeholders. Greater trust.
          </h2>
        </Reveal>
        <NetworkDiagram />
      </section>

      <section id="how" className={`${sectionPad} bg-bhuid-ivory`}>
        <SectionLabel>03 · HOW IT WORKS</SectionLabel>
        <Reveal>
          <h2 className={`${h2Base} text-[clamp(30px,5vw,64px)]`}>Four steps. Every one on record.</h2>
        </Reveal>
        <Timeline />
      </section>

      <section id="privacy" className={`${sectionPad} bg-bhuid-green text-bhuid-ivory`}>
        <SectionLabel onDark>04 · PRIVACY AND CONTROL</SectionLabel>
        <Reveal>
          <h2 className={`${h2Base} text-[clamp(30px,5vw,64px)]`}>Your documents. Your permission.</h2>
        </Reveal>
        <div className="mt-[8vh] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-px border border-bhuid-gold/30 bg-bhuid-gold/30">
          {PRIVACY_POINTS.map(point => (
            <Reveal
              key={point.title}
              className="bg-bhuid-green px-[26px] py-8 transition-colors duration-300 hover:bg-[#17463a]"
            >
              <h3 className="m-0 mb-2.5 font-heading text-[19px] tracking-[-0.03em] text-bhuid-gold">{point.title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-[#cfd3c9]">{point.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="demo" className={`${sectionPad} bg-bhuid-ivory`}>
        <SectionLabel>05 · TRY THE CONSENT WORKFLOW</SectionLabel>
        <Reveal>
          <h2 className={`${h2Base} max-w-[760px] text-[clamp(28px,4.4vw,56px)]`}>
            Play all three roles in one click-through.
          </h2>
        </Reveal>
        <span className="mt-[18px] inline-block border border-dashed border-bhuid-forest px-2.5 py-[5px] text-xs text-bhuid-forest">
          DEMO ONLY · frontend simulation, not real security enforcement
        </span>
        <ConsentDemo />
      </section>

      <section className="bg-[radial-gradient(circle_at_70%_30%,#1F5B49,#123C32_65%)] px-[5vw] py-[20vh] text-center text-bhuid-ivory">
        <Reveal>
          <h2 className={`${h2Base} mx-auto mb-9 max-w-[900px] text-[clamp(34px,6vw,84px)] leading-none`}>
            Bring every property record <span className="text-bhuid-gold">closer to trust.</span>
          </h2>
        </Reveal>
        <Reveal>
          <LandingButton primary href="#hero">
            Explore the Platform
          </LandingButton>
        </Reveal>
      </section>

      <footer className="bg-bhuid-charcoal px-[5vw] pb-10 pt-[60px] text-sm text-[#bfc4bd]">
        <div className="flex flex-wrap justify-between gap-7">
          <div className="font-heading text-base font-extrabold tracking-[.28em] text-bhuid-ivory">SURAKSHA SETU</div>
          <div>
            <a href="#hero" className={FOOTER_LINK}>
              About
            </a>
            <a href="#how" className={FOOTER_LINK}>
              How it works
            </a>
            <Link to="/society/dashboard" className={FOOTER_LINK}>
              Society Portal
            </Link>
            <Link to="/homeowner/dashboard" className={FOOTER_LINK}>
              Homeowner Portal
            </Link>
            <Link to="/bank/dashboard" className={FOOTER_LINK}>
              Bank Portal
            </Link>
            <a href="#privacy" className={FOOTER_LINK}>
              Privacy
            </a>
            <a href="#hero" className={FOOTER_LINK}>
              Contact
            </a>
          </div>
        </div>
        <small className="mt-[34px] block leading-normal opacity-60">
          Suraksha Setu is an independent prototype. It is not affiliated with, or certified by, any government body.
          Uploaded documents do not establish legal title.
        </small>
      </footer>
    </div>
  )
}
