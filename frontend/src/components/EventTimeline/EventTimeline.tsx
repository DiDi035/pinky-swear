import type { EventData } from "../../lib/api";
import { statusColor } from "../../lib/format";
import styles from "./EventTimeline.module.css";

interface Props {
  events: EventData[];
}

const EVENT_LABELS: Record<string, string> = {
  ESCROW_CREATED: "Escrow Created",
  DEPOSITED: "Funds Deposited",
  CONFIRMED: "Delivery Confirmed",
  REFUNDED: "Funds Refunded",
};

export default function EventTimeline({ events }: Props) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className={styles.timeline}>
      {sorted.map((event) => (
        <div key={event.id} className={styles.event}>
          <div
            className={styles.dot}
            style={{ backgroundColor: statusColor(event.eventName) }}
          />
          <div className={styles.content}>
            <div className={styles.header}>
              <span className={styles.name}>
                {EVENT_LABELS[event.eventName] || event.eventName}
              </span>
              <span className={styles.time}>
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>
            <div className={styles.meta}>
              <a
                href={`https://sepolia.etherscan.io/tx/${event.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                {event.txHash.slice(0, 10)}...{event.txHash.slice(-6)}
              </a>
              <span className={styles.block}>Block #{event.blockNumber}</span>
              {!event.isFinalized && (
                <span className={styles.confirmations}>
                  {event.confirmations}/12 confirmations
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
