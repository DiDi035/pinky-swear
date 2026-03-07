import { NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={styles.logo}>
        <span className={styles.logoPinky}>pinky</span>
        <span className={styles.logoSwear}>_swear</span>
      </NavLink>

      <div className={styles.links}>
        <NavLink
          to="/escrows"
          className={({ isActive }) =>
            isActive ? styles.linkActive : styles.link
          }
        >
          Escrows
        </NavLink>
        <NavLink
          to="/create"
          className={({ isActive }) =>
            isActive ? styles.linkActive : styles.link
          }
        >
          Create
        </NavLink>
      </div>

      <div className={styles.wallet}>
        <ConnectButton showBalance={false} />
      </div>
    </nav>
  );
}
