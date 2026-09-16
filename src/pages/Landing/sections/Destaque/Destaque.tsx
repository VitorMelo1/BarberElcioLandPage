import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Destaque.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Seção-assinatura (estilo Zentry "About"): a imagem cresce de um card pequeno
 * até a tela inteira conforme o scroll, com a seção pinada.
 */
export function Destaque() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const media=gsap.matchMedia();
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)",()=>{
      const ctx=gsap.context(()=>{
        gsap.to(`.${styles.clip}`,{width:"100%",height:"100vh",borderRadius:0,scrollTrigger:{trigger:`.${styles.clipWrap}`,start:"center center",end:"+=800 center",scrub:.5,pin:true,pinSpacing:true,invalidateOnRefresh:true}});
      },ref);
      return()=>ctx.revert();
    });
    return()=>media.revert();
  },[]);

  return (
    <section id="destaque" ref={ref} className={styles.section}>
      <div className={styles.head}>
        <p className={styles.kicker}>O ofício</p>
        <h2 className={styles.title}>Não é corte.<br/>É assinatura.</h2>
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
