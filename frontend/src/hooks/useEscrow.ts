import { useState, useEffect } from 'react'
import { fetchEscrow, type EscrowWithEvents } from '../lib/api'

interface UseEscrowResult {
  escrow: EscrowWithEvents | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useEscrow(address: string): UseEscrowResult {
  const [escrow, setEscrow] = useState<EscrowWithEvents | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchEscrow(address)
      .then((res) => {
        if (cancelled) return
        setEscrow(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [address, tick])

  return { escrow, loading, error, refetch: () => setTick((t) => t + 1) }
}
