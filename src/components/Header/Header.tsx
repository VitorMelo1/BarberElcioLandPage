import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";

const LINKS = [
  { id: "especialidades", label: "Especialidades" },
  { id: "portfolio", label: "Portfólio" },
  { id: "avaliacao", label: "Avaliação" },
  { id: "servicos", label: "Serviços" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const motion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  useEffect(()=>{
    if(!open)return;
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keydown=(event:KeyboardEvent)=>{if(event.key === "Escape"){setOpen(false);trigger.current?.focus();}};
    document.addEventListener("keydown",keydown);
    return()=>document.removeEventListener("keydown",keydown);
  },[open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: motion(), block: "start" });
    setOpen(false);
  };

  return (
    <header className={`${styles.header} ${scrolled || open ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.brand}
          aria-label="Studio do Bruxo — voltar ao início"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: motion() });
            setOpen(false);
          }}
        >
          <img src="/images/emblema.png" alt="" className={styles.brandIcon} />
          <span className={styles.brandLabel}>
            Bruxo<em> dos Cabelos</em>
          </span>
        </button>

        <nav className={styles.nav} aria-label="Seções do site">
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
            ref={trigger}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-controls="public-menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {open && <nav id="public-menu" ref={menu} aria-label="Menu móvel" className={`${styles.panel} ${styles.panelOpen}`}>
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
      </nav>}
    </header>
  );
}
