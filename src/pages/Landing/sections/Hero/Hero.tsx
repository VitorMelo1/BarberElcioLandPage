import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Cena 1 — vídeo do corte ao fundo + overlay da marca. Entrada cinematográfica
 * no load (emblema, frase, sub e CTA em cascata) + parallax no scroll.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [paused,setPaused] = useState(true);
  const [reduced,setReduced] = useState(()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const change=()=>{setReduced(media.matches);if(media.matches)video.current?.pause();};
    media.addEventListener("change",change);return()=>media.removeEventListener("change",change);
  },[]);
  async function toggleVideo(){if(!video.current)return;if(video.current.paused){try{await video.current.play();}catch{setPaused(true);}}else video.current.pause();}


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
        ref={video}
        aria-hidden="true"
        tabIndex={-1}
        preload="metadata"
        autoPlay={!reduced}
        onCanPlay={() => { if (!reduced && video.current?.paused) void video.current.play().catch(() => setPaused(true)); }}
        onPlay={()=>setPaused(false)}
        onPause={()=>setPaused(true)}
        muted
        loop
        playsInline
        poster="/images/hero-poster.jpg"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
        <source src="/videos/hero.webm" type="video/webm" />
      </video>

      <div className={styles.overlay} aria-hidden />
      <span className={styles.videoBadge}>Vídeo real do trabalho</span>

      <div className={styles.content}>
        <img
          className={styles.emblem}
          src="/images/emblema.png"
          alt="Emblema do Studio do Bruxo dos Cabelos"
        />
        <p className={styles.eyebrow}>Studio · Freestyle · Colorimetria — Anápolis GO</p>
        <h1 className={styles.title}>BRUXO DOS CABELOS</h1>
        <p className={styles.sub}>Freestyle e Colorimetria com Elcio.</p>
        <p className={styles.invitation}>Sua ideia de desenho ou cor começa com uma avaliação.</p>
        <a className={styles.cta} href="#avaliacao">Agendar avaliação</a>
        <a className={styles.workLink} href="#portfolio">Ver trabalhos</a>
      </div>

<button type="button" className={styles.videoControl} onClick={()=>void toggleVideo()}>{paused ? "Reproduzir vídeo" : "Pausar vídeo"}</button>
      <div className={styles.scrollHint} aria-hidden>
        role para ver a mágica ↓
      </div>
    </section>
  );
}
