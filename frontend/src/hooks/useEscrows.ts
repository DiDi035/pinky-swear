import { useState, useEffect } from 'react'
import { fetchEscrows, type EscrowData } from '../lib/api'

interface UseEscrowsParams {
  buyer?: string
  seller?: string
  offset?: number
  limit?: number
}

interface UseEscrowsResult {
  escrows: EscrowData[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useEscrows(params?: UseEscrowsParams): UseEscrowsResult {
  const [escrows, setEscrows] = useState<EscrowData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const serializedParams = JSON.stringify(params)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchEscrows(params)
      .then((res) => {
        if (cancelled) return
        setEscrows(res.data)
        setTotal(res.total)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [serializedParams, tick])

  return { escrows, total, loading, error, refetch: () => setTick((t) => t + 1) }
}
