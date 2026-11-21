import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  'data-n'?: number
}

/** Fades and lifts its content into view once, the first time it scrolls on screen. */
export default function Reveal({ children, className, delay = 0, 'data-n': dataN }: RevealProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <div className={className} data-n={dataN}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={className}
      data-n={dataN}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.215, 0.61, 0.355, 1] }}
    >
      {children}
    </motion.div>
  )
}
