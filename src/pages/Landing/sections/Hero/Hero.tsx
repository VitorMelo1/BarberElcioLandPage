import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Cena 1 — vídeo do corte ao fundo + overlay da marca. Entrada cinematográfica
 * no load (emblema, frase, sub e CTA em cascata) + parallax no scroll.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(`.${styles.emblem}`, {
        scale: 0.6,
        opacity: 0,
        rotate: -25,
        duration: 1,
        ease: "back.out(1.6)",
      })
        .from(`.${styles.eyebrow}`, { y: 16, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(`.${styles.title}`, { y: 44, opacity: 0, duration: 0.9 }, "-=0.3")
        .from(`.${styles.sub}`, { y: 20, opacity: 0, duration: 0.6 }, "-=0.5")
        .from(`.${styles.cta}`, { y: 16, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(`.${styles.scrollHint}`, { opacity: 0, duration: 0.6 }, "-=0.2");

      // emblema flutuando de leve
      gsap.to(`.${styles.emblem}`, {
        y: -10,
        duration: 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1.3,
      });

      // parallax: conteúdo sobe e some ao rolar
      gsap.to(`.${styles.content}`, {
        y: -90,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.hero} id="top" ref={ref}>
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-poster.jpg"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
        <source src="/videos/hero.webm" type="video/webm" />
      </video>

      <div className={styles.overlay} aria-hidden />

      <div className={styles.content}>
        <img
          className={styles.emblem}
          src="/images/emblema.png"
          alt="Emblema do Studio do Bruxo dos Cabelos"
        />
        <p className={styles.eyebrow}>Studio · Freestyle · Colorimetria — Anápolis GO</p>
        <h1 className={styles.title}>BRUXO DOS CABELOS</h1>
        <p className={styles.sub}>A tesoura é pincel. O cabelo é tela.</p>
        <button type="button" className={styles.cta} onClick={() => navigate("/app")}>
          Agendar
        </button>
      </div>

      <div className={styles.scrollHint} aria-hidden>
        role para ver a mágica ↓
      </div>
    </section>
  );
}
