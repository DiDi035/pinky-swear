const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export interface EscrowData {
  id: string
  buyer: string
  seller: string
  amount: string
  deadline: string
  status: 'AWAITING_DEPOSIT' | 'DEPOSITED' | 'CONFIRMED' | 'REFUNDED'
  createdAt: string
  updatedAt: string
  createdTxHash: string
  createdBlockNumber: number
  isFinalized: boolean
}

export interface EventData {
  id: string
  escrowId: string
  eventName: 'ESCROW_CREATED' | 'DEPOSITED' | 'CONFIRMED' | 'REFUNDED'
  txHash: string
  blockNumber: number
  blockHash: string
  logIndex: number
  data: Record<string, unknown>
  createdAt: string
  confirmations: number
  isFinalized: boolean
}

export interface EscrowWithEvents extends EscrowData {
  events: EventData[]
}

interface ListResponse<T> {
  data: T[]
  total: number
  offset: number
  limit: number
}

interface SingleResponse<T> {
  data: T
}

export async function fetchEscrows(params?: {
  buyer?: string
  seller?: string
  offset?: number
  limit?: number
}): Promise<ListResponse<EscrowData>> {
  const searchParams = new URLSearchParams()
  if (params?.buyer) searchParams.set('buyer', params.buyer)
  if (params?.seller) searchParams.set('seller', params.seller)
  if (params?.offset) searchParams.set('offset', String(params.offset))
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const res = await fetch(`${API_BASE}/escrows?${searchParams}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchEscrow(address: string): Promise<SingleResponse<EscrowWithEvents>> {
  const res = await fetch(`${API_BASE}/escrows/${address}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
