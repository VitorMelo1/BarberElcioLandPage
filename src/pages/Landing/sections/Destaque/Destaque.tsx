import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedTitle } from "../../../../components/AnimatedTitle/AnimatedTitle";
import styles from "./Destaque.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Seção-assinatura (estilo Zentry "About"): a imagem cresce de um card pequeno
 * até a tela inteira conforme o scroll, com a seção pinada.
 */
export function Destaque() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(`.${styles.clip}`, {
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        scrollTrigger: {
          trigger: `.${styles.clipWrap}`,
          start: "center center",
          end: "+=800 center",
          scrub: 0.5,
          pin: true,
          pinSpacing: true,
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="destaque" ref={ref} className={styles.section}>
      <div className={styles.head}>
        <p className={styles.kicker}>O ofício</p>
        <AnimatedTitle title={"Não é corte.<br/>É <b>assinatura</b>."} className={styles.title} />
        <p className={styles.lead}>
          Freestyle, colorimetria e precisão — cada cabeça sai da cadeira como uma obra.
        </p>
      </div>

      <div className={styles.clipWrap}>
        <div className={styles.clip}>
          <img
            src="/images/portfolio/look-01.jpg"
            alt="Freestyle com desenho de chamas na parede da mandala"
            className={styles.img}
          />
        </div>
      </div>
    </section>
  );
}
