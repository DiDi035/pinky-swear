import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, isAddress } from "viem";
import { ESCROW_FACTORY_ABI, FACTORY_ADDRESS } from "../lib/contracts";
import styles from "./CreateEscrow.module.css";

export default function CreateEscrow() {
  const navigate = useNavigate();
  const { address: walletAddress } = useAccount();

  const { data: ownerAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ESCROW_FACTORY_ABI,
    functionName: "owner",
  });

  const isOwner =
    walletAddress &&
    ownerAddress &&
    walletAddress.toLowerCase() === (ownerAddress as string).toLowerCase();

  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  if (isSuccess) {
    setTimeout(() => navigate("/escrows"), 3000);
  }

  const isValid =
    isAddress(buyer) &&
    isAddress(seller) &&
    buyer !== seller &&
    Number(amount) > 0 &&
    Number(deadlineDays) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const deadlineSeconds = BigInt(Math.floor(Number(deadlineDays) * 86400));
    const amountWei = parseEther(amount);

    writeContract({
      address: FACTORY_ADDRESS,
      abi: ESCROW_FACTORY_ABI,
      functionName: "createEscrow",
      args: [
        buyer as `0x${string}`,
        seller as `0x${string}`,
        amountWei,
        deadlineSeconds,
      ],
    });
  };

  return (
    <div className={styles.page}>
      <h1 className={`${styles.title} fade-up stagger-1`}>Create Escrow</h1>

      {!walletAddress ? (
        <div className={`${styles.message} fade-up stagger-2`}>
          Connect your wallet to create an escrow.
        </div>
      ) : !isOwner ? (
        <div className={`${styles.message} fade-up stagger-2`}>
          Only the factory owner can create escrows. Your address is not the
          owner.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={`${styles.card} fade-up stagger-2`}
          style={{ boxShadow: "8px 8px 0 var(--pink-pop)" }}
        >
          <div className={styles.field}>
            <label className={styles.label}>Buyer Address</label>
            <input
              className={styles.input}
              type="text"
              placeholder="0x..."
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Seller Address</label>
            <input
              className={styles.input}
              type="text"
              placeholder="0x..."
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Amount (ETH)</label>
              <input
                className={styles.input}
                type="number"
                step="0.001"
                min="0"
                placeholder="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Deadline (days)</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                placeholder="7"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
              />
            </div>
          </div>

          {isValid && (
            <div className={styles.preview}>
              <h3>Summary</h3>
              <p>
                <strong>Amount:</strong> {amount} ETH
              </p>
              <p>
                <strong>Deadline:</strong> {deadlineDays} days from creation
              </p>
            </div>
          )}

          {isSuccess ? (
            <div className={styles.success}>
              Escrow created! Redirecting to escrows list...
            </div>
          ) : (
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!isValid || isPending || isConfirming}
            >
              {isPending
                ? "Waiting for wallet..."
                : isConfirming
                  ? "Confirming..."
                  : "Create Escrow"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
