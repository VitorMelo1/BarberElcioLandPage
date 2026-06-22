import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Reveal.module.css";

/** Revela o conteúdo (fade + sobe) quando entra na viewport. IntersectionObserver,
 *  sem dependência. Respeita prefers-reduced-motion via CSS. */
export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.reveal} ${visible ? styles.visible : ""}`}>
      {children}
    </div>
  );
}
