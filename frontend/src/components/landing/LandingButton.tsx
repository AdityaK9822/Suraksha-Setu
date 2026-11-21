import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type CommonProps = {
  /** Filled variant. Defaults to the outlined variant. */
  primary?: boolean
  /** "dark" is for dark green sections, "light" is for the ivory sections. */
  tone?: 'dark' | 'light'
  size?: 'lg' | 'sm'
  className?: string
  children: ReactNode
}

type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | 'href'> & { href: string }

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined }

const base =
  'inline-block cursor-pointer border font-heading font-medium no-underline transition duration-[250ms] ' +
  'hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.3)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bhuid-gold'

const sizes = {
  lg: 'px-[26px] py-3.5 text-sm',
  sm: 'px-4 py-2.5 text-[13px]',
}

const tones = {
  dark: {
    solid: 'border-bhuid-gold bg-bhuid-gold text-bhuid-green',
    outline: 'border-bhuid-gold bg-transparent text-bhuid-ivory',
  },
  light: {
    solid: 'border-bhuid-green bg-bhuid-green text-bhuid-ivory',
    outline: 'border-bhuid-green bg-transparent text-bhuid-green',
  },
}

export default function LandingButton(props: AnchorProps | NativeButtonProps) {
  const { primary = false, tone = 'dark', size = 'lg', className = '', children, ...rest } = props
  const classes = [base, sizes[size], tones[tone][primary ? 'solid' : 'outline'], className].join(' ')

  if ('href' in rest && rest.href !== undefined) {
    return (
      <a {...(rest as Omit<AnchorProps, keyof CommonProps>)} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" {...(rest as Omit<NativeButtonProps, keyof CommonProps>)} className={classes}>
      {children}
    </button>
  )
}
