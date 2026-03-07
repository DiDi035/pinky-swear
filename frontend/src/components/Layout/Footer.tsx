import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.badge}>Sepolia Testnet</span>
      <span className={styles.tagline}>made with pinky promises</span>
    </footer>
  )
}
