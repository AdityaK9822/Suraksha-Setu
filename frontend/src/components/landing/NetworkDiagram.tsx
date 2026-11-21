import { useReducedMotion } from 'framer-motion'

const NODES = [
  { letter: 'S', title: 'Housing Societies', text: 'Register the community and approve who may ask.', left: '50%', top: '18%' },
  { letter: 'H', title: 'Homeowners', text: 'Organise records and give consent, document by document.', left: '18%', top: '80%' },
  { letter: 'B', title: 'Banks', text: 'Request specific documents for a stated purpose.', left: '82%', top: '80%' },
] as const

/** Three stakeholders joined by a dashed triangle with a dot travelling around it. */
export default function NetworkDiagram() {
  const reduced = useReducedMotion()

  return (
    <div className="relative mx-auto mt-[7vh] h-[560px] max-w-[980px] min-[701px]:h-[420px]">
      <svg
        viewBox="0 0 980 420"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <g stroke="#D5B477" fill="none" strokeWidth="1.2" strokeDasharray="5 7">
          <path d="M490 80 L180 330" />
          <path d="M490 80 L800 330" />
          <path d="M180 330 L800 330" />
        </g>
        <circle cx="490" cy="80" r="5" fill="#D5B477">
          {!reduced && <animateMotion dur="9s" repeatCount="indefinite" path="M0 0 L-310 250 L310 250 L0 0" />}
        </circle>
      </svg>

      {NODES.map(node => (
        <div
          key={node.letter}
          className="absolute w-[150px] -translate-x-1/2 -translate-y-1/2 text-center min-[701px]:w-[200px]"
          style={{ left: node.left, top: node.top }}
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-3 grid h-[84px] w-[84px] place-items-center rounded-full border border-bhuid-gold bg-bhuid-green font-heading text-[26px] font-extrabold text-bhuid-gold"
          >
            {node.letter}
          </div>
          <h3 className="m-0 font-heading text-lg tracking-[-0.03em]">{node.title}</h3>
          <p className="m-0 mt-1 text-[13px] leading-[1.45] opacity-75">{node.text}</p>
        </div>
      ))}
    </div>
  )
}
