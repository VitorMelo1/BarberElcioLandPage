import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";

const LINKS = [
  { id: "bruxo", label: "O Bruxo" },
  { id: "servicos", label: "Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "planos", label: "Planos" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <header className={`${styles.header} ${scrolled || open ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setOpen(false);
          }}
        >
          <img src="/images/emblema.png" alt="" className={styles.brandIcon} />
          <span className={styles.brandLabel}>
            Bruxo<em> dos Cabelos</em>
          </span>
        </button>

        <nav className={styles.nav}>
          {LINKS.map((l) => (
            <button key={l.id} type="button" onClick={() => go(l.id)} className={styles.link}>
              {l.label}
            </button>
          ))}
        </nav>

        <div className={styles.right}>
          <button type="button" className={styles.cta} onClick={() => navigate("/app")}>
            Agendar
          </button>
          <button
            type="button"
            className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
        {LINKS.map((l) => (
          <button key={l.id} type="button" onClick={() => go(l.id)} className={styles.panelLink}>
            {l.label}
          </button>
        ))}
        <button
          type="button"
          className={styles.panelCta}
          onClick={() => {
            navigate("/app");
            setOpen(false);
          }}
        >
          Agendar
        </button>
      </div>
    </header>
  );
}
