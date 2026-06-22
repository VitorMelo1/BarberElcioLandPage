import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./AnimatedTitle.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Título estilo Zentry: cada palavra entra com rotação 3D + fade, em stagger,
 * quando o bloco aparece no scroll. Aceita <b> e <br/> no texto.
 */
export function AnimatedTitle({
  title,
  className = "",
  align = "center",
}: {
  title: string;
  className?: string;
  align?: "center" | "left";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(`.${styles.word}`, {
        opacity: 1,
        transform: "translate3d(0,0,0) rotateY(0deg) rotateX(0deg)",
        ease: "power2.inOut",
        stagger: 0.03,
        scrollTrigger: {
          trigger: ref.current,
          start: "100 bottom",
          end: "center bottom",
          toggleActions: "play none none reverse",
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={`${styles.title} ${align === "left" ? styles.left : ""} ${className}`}>
      {title.split("<br/>").map((line, i) => (
        <div key={i} className={styles.line}>
          {line
            .trim()
            .split(" ")
            .map((word, j) => (
              <span key={j} className={styles.word} dangerouslySetInnerHTML={{ __html: word }} />
            ))}
        </div>
      ))}
    </div>
  );
}
