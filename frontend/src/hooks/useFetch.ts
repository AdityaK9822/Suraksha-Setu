import { useState, useEffect, type DependencyList } from 'react'

export function useFetch<T>(fn: () => Promise<T> | T, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    Promise.resolve()
      .then(fn)
      .then(d => {
        if (mounted) {
          setData(d)
          setLoading(false)
        }
      })
      .catch(e => {
        if (mounted) {
          setError(e?.response?.data?.error || e?.message || 'Failed to load')
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, deps)

  return { data, loading, error, setData }
}
