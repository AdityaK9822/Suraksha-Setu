import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../services/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: Record<string, unknown>) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('bhuid_token')
    if (!t) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => localStorage.removeItem('bhuid_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const r = await api.post('/auth/login', { email, password })
    localStorage.setItem('bhuid_token', r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  const register = async (payload: Record<string, unknown>): Promise<User> => {
    const r = await api.post('/auth/register', payload)
    localStorage.setItem('bhuid_token', r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  const logout = () => {
    localStorage.removeItem('bhuid_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
