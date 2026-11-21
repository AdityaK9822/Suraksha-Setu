import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import { ShieldCheck, Building2, Home, Landmark, KeyRound, type LucideIcon } from 'lucide-react'
import api from '../../services/api'
import type { UserRole } from '../../types'

interface DemoAccount {
  role: UserRole
  label: string
  email: string
  icon: LucideIcon
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'SOCIETY_ADMIN', label: 'Society Admin', email: 'admin@greenvalley.demo', icon: Building2 },
  { role: 'HOMEOWNER', label: 'Homeowner', email: 'aarav@greenvalley.demo', icon: Home },
  { role: 'BANK_USER', label: 'Bank Officer', email: 'bank@demo.bank', icon: Landmark },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam) {
      const found = DEMO_ACCOUNTS.find(d => d.role === roleParam)
      if (found) {
        setEmail(found.email)
        setPassword('Password@123')
      }
    }
  }, [searchParams])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setResetMsg('')
    setLoading(true)
    try {
      const u = await login(email, password)
      if (u.role === 'SOCIETY_ADMIN') navigate('/society/dashboard')
      else if (u.role === 'HOMEOWNER') navigate('/homeowner/dashboard')
      else if (u.role === 'BANK_USER') navigate('/bank/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please verify your email and password.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = async (acct: DemoAccount) => {
    setEmail(acct.email)
    setPassword('Password@123')
    setError('')
    setLoading(true)
    try {
      const u = await login(acct.email, 'Password@123')
      if (u.role === 'SOCIETY_ADMIN') navigate('/society/dashboard')
      else if (u.role === 'HOMEOWNER') navigate('/homeowner/dashboard')
      else if (u.role === 'BANK_USER') navigate('/bank/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Enter your email address above first to request a password reset.')
      return
    }
    setError('')
    try {
      const r = await api.post('/auth/password-reset', { email })
      setResetMsg(r.data.message)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not process reset request')
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bhuid-ivory">
      <div className="hidden md:flex flex-col justify-between bg-bhuid-green text-bhuid-ivory p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(circle at 30% 20%, #D5B477, transparent 50%)' }}
        />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bhuid-gold/20 border border-bhuid-gold/40 flex items-center justify-center">
              <span className="font-heading font-bold text-bhuid-gold">S</span>
            </div>
            <span className="font-heading text-3xl font-bold">Suraksha Setu</span>
          </Link>
          <p className="mt-3 text-bhuid-ivory/75">Your Property. Your Identity. Your Trust.</p>
        </div>

        <div className="relative space-y-5">
          <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 text-bhuid-gold font-semibold text-sm">
              <ShieldCheck size={18} />
              <span>Role-Enforced Security Architecture</span>
            </div>
            <p className="text-xs text-bhuid-ivory/75 leading-relaxed">
              Societies establish flat records. Homeowners manage private property and loan documents. Banks request
              targeted verification strictly with two-key approval.
            </p>
          </div>
          <div className="text-xs text-bhuid-ivory/50">
            All sessions are authenticated via signed JWT tokens and server-side role guards.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md bg-white p-8 rounded-2xl border border-neutral-200/90 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading text-3xl font-bold text-bhuid-green">Sign In</h2>
            <Link to="/" className="text-xs text-bhuid-forest hover:underline">
              ← Back to Home
            </Link>
          </div>
          <p className="text-sm text-neutral-500 mb-6">Access your Suraksha Setu role-based portal.</p>

          {/* 1-Click Demo Role Switcher Pills */}
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Instant Demo Sign-In (1-Click)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acct => {
                const Icon = acct.icon
                return (
                  <button
                    key={acct.role}
                    type="button"
                    onClick={() => handleQuickDemo(acct)}
                    className="p-2.5 rounded-lg border border-neutral-200 hover:border-bhuid-forest hover:bg-bhuid-ivory/60 text-left transition group"
                  >
                    <Icon size={15} className="text-bhuid-forest mb-1" />
                    <div className="text-xs font-semibold text-bhuid-charcoal group-hover:text-bhuid-green">
                      {acct.label}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">{acct.email}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {error}
            </div>
          )}
          {resetMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
              {resetMsg}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-bhuid-charcoal">Password</label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-xs text-bhuid-forest hover:underline flex items-center gap-1"
                >
                  <KeyRound size={12} /> Forgot password?
                </button>
              </div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            New to Suraksha Setu?{' '}
            <Link to="/register" className="text-bhuid-forest font-semibold underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
