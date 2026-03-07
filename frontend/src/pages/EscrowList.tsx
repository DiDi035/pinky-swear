import { useState } from "react";
import { useEscrows } from "../hooks/useEscrows";
import EscrowCard from "../components/EscrowCard/EscrowCard";
import styles from "./EscrowList.module.css";

const PAGE_SIZE = 12;

export default function EscrowList() {
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [offset, setOffset] = useState(0);

  const { escrows, total, loading, error } = useEscrows({
    buyer: buyer || undefined,
    seller: seller || undefined,
    offset,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className={styles.page}>
      <h1 className={`${styles.title} fade-up stagger-1`}>Escrows</h1>

      <div className={`${styles.filters} fade-up stagger-2`}>
        <input
          className={styles.input}
          type="text"
          placeholder="Filter by buyer address..."
          value={buyer}
          onChange={(e) => {
            setBuyer(e.target.value);
            setOffset(0);
          }}
        />
        <input
          className={styles.input}
          type="text"
          placeholder="Filter by seller address..."
          value={seller}
          onChange={(e) => {
            setSeller(e.target.value);
            setOffset(0);
          }}
        />
      </div>

      {error && (
        <div className={styles.error}>Failed to load escrows: {error}</div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : escrows.length === 0 ? (
        <div className={`${styles.empty} fade-up stagger-3`}>
          <p>No escrows found.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {escrows.map((escrow, i) => (
              <div
                key={escrow.id}
                className={`fade-up stagger-${Math.min(i + 3, 6)}`}
              >
                <EscrowCard escrow={escrow} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={currentPage <= 1}
                onClick={() => setOffset(offset - PAGE_SIZE)}
              >
                ← Prev
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={currentPage >= totalPages}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
