import { Link } from 'react-router-dom'
import type { EscrowData } from '../../lib/api'
import { formatEth, statusColor } from '../../lib/format'
import { useCountdown } from '../../hooks/useCountdown'
import StatusPill from '../StatusPill/StatusPill'
import AddressDisplay from '../AddressDisplay/AddressDisplay'
import styles from './EscrowCard.module.css'

interface Props {
  escrow: EscrowData
}

export default function EscrowCard({ escrow }: Props) {
  const { timeLeft } = useCountdown(escrow.deadline)
  const shadowColor = statusColor(escrow.status)

  return (
    <Link
      to={`/escrows/${escrow.id}`}
      className={styles.card}
      style={{ boxShadow: `8px 8px 0 ${shadowColor}` }}
    >
      <div className={styles.header}>
        <StatusPill status={escrow.status} size="sm" />
        <span className={styles.deadline}>{timeLeft}</span>
      </div>

      <div className={styles.amount}>
        {formatEth(escrow.amount)} <span className={styles.eth}>ETH</span>
      </div>

      <div className={styles.parties}>
        <div className={styles.party}>
          <span className={styles.role}>Buyer</span>
          <AddressDisplay address={escrow.buyer} />
        </div>
        <div className={styles.party}>
          <span className={styles.role}>Seller</span>
          <AddressDisplay address={escrow.seller} />
        </div>
      </div>
    </Link>
  )
}
