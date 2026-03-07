import { useParams } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useEscrow } from '../hooks/useEscrow'
import { useCountdown } from '../hooks/useCountdown'
import { formatEth, statusColor } from '../lib/format'
import { ESCROW_ABI } from '../lib/contracts'
import StatusPill from '../components/StatusPill/StatusPill'
import AddressDisplay from '../components/AddressDisplay/AddressDisplay'
import ProgressStepper from '../components/ProgressStepper/ProgressStepper'
import EventTimeline from '../components/EventTimeline/EventTimeline'
import styles from './EscrowDetail.module.css'

export default function EscrowDetail() {
  const { address } = useParams<{ address: string }>()
  const { address: walletAddress } = useAccount()
  const { escrow, loading, error, refetch } = useEscrow(address!)
  const { timeLeft, expired } = useCountdown(escrow?.deadline || 0)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  if (isSuccess) {
    refetch()
  }

  if (loading) {
    return <div className={styles.skeleton} />
  }

  if (error || !escrow) {
    return <div className={styles.error}>Escrow not found.</div>
  }

  const isBuyer = walletAddress?.toLowerCase() === escrow.buyer.toLowerCase()
  const isSeller = walletAddress?.toLowerCase() === escrow.seller.toLowerCase()
  const shadowColor = statusColor(escrow.status)

  const handleDeposit = () => {
    writeContract({
      address: address as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'deposit',
      value: BigInt(escrow.amount),
    })
  }

  const handleConfirm = () => {
    writeContract({
      address: address as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'confirmDelivery',
    })
  }

  const handleRefund = () => {
    writeContract({
      address: address as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'refund',
    })
  }

  return (
    <div className={styles.page}>
      <div
        className={`${styles.card} fade-up stagger-1`}
        style={{ boxShadow: `8px 8px 0 ${shadowColor}` }}
      >
        <div className={styles.header}>
          <AddressDisplay address={escrow.id} full />
          <StatusPill status={escrow.status} size="lg" />
        </div>

        <div className={styles.amount}>
          {formatEth(escrow.amount)} <span className={styles.eth}>ETH</span>
        </div>

        <div className={styles.parties}>
          <div className={styles.party}>
            <span className={styles.role}>Buyer</span>
            <AddressDisplay address={escrow.buyer} />
            {isBuyer && <span className={styles.you}>You</span>}
          </div>
          <div className={styles.party}>
            <span className={styles.role}>Seller</span>
            <AddressDisplay address={escrow.seller} />
            {isSeller && <span className={styles.you}>You</span>}
          </div>
        </div>

        <div className={styles.deadline}>
          {expired ? 'Deadline passed' : `Deadline: ${timeLeft}`}
        </div>

        <ProgressStepper status={escrow.status} />

        {/* Action Zone */}
        <div className={styles.actions}>
          {escrow.status === 'AWAITING_DEPOSIT' && isBuyer && (
            <button className={styles.actionBtn} style={{ background: 'var(--mint-fresh)' }} onClick={handleDeposit} disabled={isPending || isConfirming}>
              {isPending ? 'Waiting for wallet...' : isConfirming ? 'Confirming...' : `Deposit ${formatEth(escrow.amount)} ETH`}
            </button>
          )}

          {escrow.status === 'DEPOSITED' && (isBuyer || isSeller) && !expired && (
            <button className={styles.actionBtn} style={{ background: 'var(--sunny)' }} onClick={handleConfirm} disabled={isPending || isConfirming}>
              {isPending ? 'Waiting for wallet...' : isConfirming ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          )}

          {escrow.status === 'DEPOSITED' && isBuyer && expired && (
            <button className={styles.actionBtn} style={{ background: 'var(--lilac-dream)' }} onClick={handleRefund} disabled={isPending || isConfirming}>
              {isPending ? 'Waiting for wallet...' : isConfirming ? 'Confirming...' : 'Refund'}
            </button>
          )}

          {!walletAddress && (
            <p className={styles.connectHint}>Connect your wallet to interact with this escrow.</p>
          )}
        </div>
      </div>

      {escrow.events.length > 0 && (
        <div className="fade-up stagger-2">
          <h2 className={styles.eventsTitle}>Events</h2>
          <EventTimeline events={escrow.events} />
        </div>
      )}
    </div>
  )
}
