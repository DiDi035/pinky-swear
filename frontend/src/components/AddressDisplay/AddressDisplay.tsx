import { useState } from "react";
import { truncateAddress } from "../../lib/format";
import styles from "./AddressDisplay.module.css";

interface Props {
  address: string;
  full?: boolean;
}

export default function AddressDisplay({ address, full = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className={styles.container}
      onClick={handleCopy}
      title="Copy address"
    >
      <span className={styles.address}>
        {full ? address : truncateAddress(address)}
      </span>
      {copied && <span className={styles.toast}>Copied!</span>}
    </button>
  );
}
