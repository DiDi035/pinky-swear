import { formatEther } from 'viem'

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatEth(weiString: string): string {
  return formatEther(BigInt(weiString))
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    AWAITING_DEPOSIT: 'var(--pink-pop)',
    DEPOSITED: 'var(--mint-fresh)',
    CONFIRMED: 'var(--sunny)',
    REFUNDED: 'var(--lilac-dream)',
  }
  return colors[status] || 'var(--ink)'
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    AWAITING_DEPOSIT: 'Awaiting Deposit',
    DEPOSITED: 'Deposited',
    CONFIRMED: 'Confirmed',
    REFUNDED: 'Refunded',
  }
  return labels[status] || status
}
