import styles from './ProgressStepper.module.css'

const STEPS = [
  { key: 'AWAITING_DEPOSIT', label: 'Created', color: 'var(--pink-pop)' },
  { key: 'DEPOSITED', label: 'Deposited', color: 'var(--mint-fresh)' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'var(--sunny)' },
]

const STATUS_ORDER = ['AWAITING_DEPOSIT', 'DEPOSITED', 'CONFIRMED', 'REFUNDED']

interface Props {
  status: string
}

export default function ProgressStepper({ status }: Props) {
  const currentIndex = STATUS_ORDER.indexOf(status)
  const isRefunded = status === 'REFUNDED'

  return (
    <div className={styles.stepper}>
      {STEPS.map((step, i) => {
        const reached = currentIndex >= i && !isRefunded
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.key} className={styles.stepGroup}>
            <div className={styles.step}>
              <div
                className={`${styles.circle} ${reached ? styles.filled : ''}`}
                style={reached ? { backgroundColor: step.color } : undefined}
              >
                {reached ? '\u2713' : i + 1}
              </div>
              <span className={`${styles.label} ${reached ? styles.labelActive : ''}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`${styles.connector} ${reached && currentIndex > i ? styles.connectorFilled : ''}`} />
            )}
          </div>
        )
      })}

      {isRefunded && (
        <div className={styles.stepGroup}>
          <div className={styles.connector} />
          <div className={styles.step}>
            <div className={`${styles.circle} ${styles.filled}`} style={{ backgroundColor: 'var(--lilac-dream)' }}>
              ↩
            </div>
            <span className={`${styles.label} ${styles.labelActive}`}>Refunded</span>
          </div>
        </div>
      )}
    </div>
  )
}
