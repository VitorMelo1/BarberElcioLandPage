import styles from "./Splash.module.css";

/** Tela de carregamento da marca — aparece enquanto a sessão é verificada. */
export function Splash() {
  return (
    <div className={styles.splash} role="status" aria-label="Carregando">
      <img src="/images/emblema.png" alt="" className={styles.emblem} />
      <p className={styles.text}>Studio do Bruxo</p>
    </div>
  );
}
