import { useState, useEffect } from 'react'

interface CountdownResult {
  timeLeft: string
  expired: boolean
}

export function useCountdown(deadline: string | number): CountdownResult {
  const deadlineMs = typeof deadline === 'number'
    ? deadline * 1000
    : new Date(deadline).getTime()

  const calc = () => {
    const diff = deadlineMs - Date.now()
    if (diff <= 0) return { timeLeft: 'Expired', expired: true }

    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    parts.push(`${seconds}s`)

    return { timeLeft: parts.join(' '), expired: false }
  }

  const [result, setResult] = useState(calc)

  useEffect(() => {
    const interval = setInterval(() => setResult(calc()), 1000)
    return () => clearInterval(interval)
  }, [deadlineMs])

  return result
}
