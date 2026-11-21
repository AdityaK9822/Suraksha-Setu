import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import { Building2, Home, Landmark, type LucideIcon } from 'lucide-react'
import type { UserRole } from '../../types'

const roles: Array<{ value: UserRole; label: string; desc: string; icon: LucideIcon }> = [
  {
    value: 'SOCIETY_ADMIN',
    label: 'Society Admin',
    desc: 'Establish society & register homeowners',
    icon: Building2,
  },
  {
    value: 'HOMEOWNER',
    label: 'Homeowner',
    desc: 'Manage Property Passport & document locker',
    icon: Home,
  },
  {
    value: 'BANK_USER',
    label: 'Bank Officer',
    desc: 'Search societies & request consent-backed records',
    icon: Landmark,
  },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<{
    name: string
    email: string
    password: string
    role: UserRole
    phone: string
    institutionName: string
    branch: string
    designation: string
  }>({
    name: '',
    email: '',
    password: '',
    role: 'SOCIETY_ADMIN',
    phone: '',
    institutionName: '',
    branch: '',
    designation: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const r = searchParams.get('role')
    if (r === 'SOCIETY_ADMIN' || r === 'HOMEOWNER' || r === 'BANK_USER') {
      setForm(f => ({ ...f, role: r }))
    }
  }, [searchParams])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await register(form)
      if (u.role === 'SOCIETY_ADMIN') navigate('/society/create')
      else if (u.role === 'HOMEOWNER') navigate('/homeowner/dashboard')
      else if (u.role === 'BANK_USER') navigate('/bank/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bhuid-ivory">
      <div className="hidden md:flex flex-col justify-between bg-bhuid-green text-bhuid-ivory p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(circle at 70% 80%, #D5B477, transparent 50%)' }}
        />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bhuid-gold/20 border border-bhuid-gold/40 flex items-center justify-center">
              <span className="font-heading font-bold text-bhuid-gold">S</span>
            </div>
            <span className="font-heading text-3xl font-bold">Suraksha Setu</span>
          </Link>
          <p className="mt-3 text-bhuid-ivory/75">Join the trusted property identity ecosystem.</p>
        </div>
        <div className="relative text-sm text-bhuid-ivory/70 space-y-2">
          <p>Select your portal role to configure your account permissions.</p>
          <p className="text-xs text-bhuid-ivory/50">
            Note: Individual homeowners are typically registered and linked to their flat by their Society Admin, or can
            register with their registered society email.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg bg-white p-8 rounded-2xl border border-neutral-200/90 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading text-3xl font-bold text-bhuid-green">Create Account</h2>
            <Link to="/" className="text-xs text-bhuid-forest hover:underline">
              ← Home
            </Link>
          </div>
          <p className="text-sm text-neutral-500 mb-6">Choose your portal role and enter your details.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Role Selector Cards */}
            <div>
              <label className="label">Select Portal Role</label>
              <div className="grid grid-cols-3 gap-2.5">
                {roles.map(r => {
                  const Icon = r.icon
                  const active = form.role === r.value
                  return (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`p-3 rounded-xl border text-left transition ${
                        active
                          ? 'bg-bhuid-green text-bhuid-ivory border-bhuid-green shadow-sm'
                          : 'bg-bhuid-ivory/40 text-bhuid-charcoal border-neutral-200 hover:border-bhuid-forest'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-bhuid-gold mb-1' : 'text-bhuid-forest mb-1'} />
                      <div className="text-xs font-bold">{r.label}</div>
                      <div
                        className={`text-[10px] mt-0.5 leading-tight ${
                          active ? 'text-bhuid-ivory/75' : 'text-neutral-500'
                        }`}
                      >
                        {r.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="label">Contact Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Official Email *</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="label">Password (min 6 chars) *</label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {form.role === 'BANK_USER' && (
              <div className="p-4 rounded-xl bg-bhuid-ivory/70 border border-neutral-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-bhuid-green">
                  Bank Institution Profile (Simulated Verification)
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-bhuid-charcoal">Institution Name *</label>
                    <input
                      className="input mt-1"
                      required
                      placeholder="e.g. HDFC Bank Ltd"
                      value={form.institutionName}
                      onChange={e => setForm({ ...form, institutionName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-bhuid-charcoal">Branch / Office</label>
                    <input
                      className="input mt-1"
                      placeholder="e.g. Mumbai Fort"
                      value={form.branch}
                      onChange={e => setForm({ ...form, branch: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-bhuid-charcoal">Designation</label>
                    <input
                      className="input mt-1"
                      placeholder="e.g. Credit Manager"
                      value={form.designation}
                      onChange={e => setForm({ ...form, designation: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <button className="btn btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Suraksha Setu Account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-bhuid-forest font-semibold underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
