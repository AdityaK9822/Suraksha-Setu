import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { NavItem } from '../types'

export default function DashboardLayout({ nav }: { nav: NavItem[] }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const handleLogout = () => {
    logout()
    navigate('/')
  }
  return (
    <div className="min-h-screen flex bg-bhuid-ivory">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-bhuid-green to-bhuid-forest text-bhuid-ivory transform transition-transform duration-300 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:static`}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bhuid-gold/20 flex items-center justify-center">
              <span className="font-heading font-bold text-bhuid-gold">S</span>
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold leading-none">Suraksha Setu</h1>
              <p className="text-xs opacity-60 mt-1 capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {nav.map(item => {
            const active = location.pathname === item.to
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  active ? 'bg-white/15 text-white shadow-sm' : 'text-bhuid-ivory/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {Icon && <Icon size={18} className={active ? 'text-bhuid-gold' : ''} />}
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} className="text-bhuid-gold" />}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-bhuid-ivory/70 hover:bg-white/10 hover:text-white w-full transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 bg-bhuid-green text-white p-4 flex items-center justify-between z-20">
          <h1 className="font-heading font-bold">Suraksha Setu</h1>
          <button onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </header>
        <main className="p-6 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
