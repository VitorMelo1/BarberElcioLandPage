import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import { Header } from "../../components/Header/Header";
import { Reveal } from "../../components/Reveal/Reveal";
import { Hero } from "./sections/Hero/Hero";
import { Destaque } from "./sections/Destaque/Destaque";
import { OBruxo } from "./sections/OBruxo/OBruxo";
import { Servicos } from "./sections/Servicos/Servicos";
import { Portfolio } from "./sections/Portfolio/Portfolio";
import { Depoimentos } from "./sections/Depoimentos/Depoimentos";
import { Planos } from "./sections/Planos/Planos";
import { Agendamento } from "./sections/Agendamento/Agendamento";
import { Local } from "./sections/Local/Local";
import { Footer } from "./sections/Footer/Footer";

/**
 * Página Landing — composição das cenas (estratégia "Cinema do Bruxo": vídeo +
 * movimento 2D, sem WebGL). Lenis dá o scroll suave; <Reveal> anima a entrada
 * de cada seção; inspiração Zentry no AnimatedTitle e no Destaque.
 */
export function Landing() {
  useSmoothScroll();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Destaque />
        <Reveal>
          <OBruxo />
        </Reveal>
        <Reveal>
          <Servicos />
        </Reveal>
        <Reveal>
          <Portfolio />
        </Reveal>
        <Reveal>
          <Depoimentos />
        </Reveal>
        <Reveal>
          <Planos />
        </Reveal>
        <Reveal>
          <Agendamento />
        </Reveal>
        <Reveal>
          <Local />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
