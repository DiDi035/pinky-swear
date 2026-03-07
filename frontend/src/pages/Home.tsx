import { Link } from "react-router-dom";
import styles from "./Home.module.css";

const steps = [
  {
    number: "1",
    title: "Create",
    description: "Set up an escrow with buyer, seller, amount, and deadline.",
    color: "var(--pink-pop)",
  },
  {
    number: "2",
    title: "Deposit",
    description: "Buyer deposits ETH into the escrow contract.",
    color: "var(--mint-fresh)",
  },
  {
    number: "3",
    title: "Confirm",
    description: "Both parties confirm delivery. Funds release to seller.",
    color: "var(--sunny)",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={`${styles.headline} fade-up stagger-1`}>
          Shake on it.
          <br />
          <span className={styles.headlineAccent}>On-chain.</span>
        </h1>
        <p className={`${styles.subtext} fade-up stagger-2`}>
          Trustless escrow for peer-to-peer trades. No middleman, just a pinky
          promise backed by code.
        </p>
        <Link to="/create" className={`${styles.cta} fade-up stagger-3`}>
          Create an Escrow
        </Link>
      </section>

      <section className={styles.steps}>
        {steps.map((step, i) => (
          <div
            key={step.number}
            className={`${styles.stepCard} fade-up stagger-${i + 4}`}
            style={{ boxShadow: `8px 8px 0 ${step.color}` }}
          >
            <div
              className={styles.stepNumber}
              style={{ backgroundColor: step.color }}
            >
              {step.number}
            </div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
