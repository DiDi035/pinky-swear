import styles from './PageWrapper.module.css'

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return <main className={styles.main}>{children}</main>
}
