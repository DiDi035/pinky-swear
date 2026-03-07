import { statusColor, statusLabel } from "../../lib/format";
import styles from "./StatusPill.module.css";

interface Props {
  status: string;
  size?: "sm" | "md" | "lg";
}

export default function StatusPill({ status, size = "md" }: Props) {
  return (
    <span
      className={`${styles.pill} ${styles[size]}`}
      style={{ backgroundColor: statusColor(status) }}
    >
      {statusLabel(status)}
    </span>
  );
}
