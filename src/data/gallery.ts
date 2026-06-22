/**
 * Galeria do portfólio — content-driven de propósito: o barbeiro troca as fotos
 * aqui (ou via CMS na fase 2). `src` aponta para /public/images/portfolio/.
 * `mandala: true` marca as fotos com a parede da mandala ao fundo (backdrop da marca).
 */
export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  look: string;
  mandala?: boolean;
}

export const gallery: GalleryItem[] = [
  {
    id: "01",
    src: "/images/portfolio/look-01.jpg",
    alt: "Desenho de chamas com colorimetria vermelha, fundo da mandala",
    look: "Freestyle · Colorimetria",
    mandala: true,
  },
  {
    id: "07",
    src: "/images/portfolio/look-07.jpg",
    alt: "Freestyle prateado com desenho intrincado na lateral",
    look: "Freestyle",
  },
  {
    id: "03",
    src: "/images/portfolio/look-03.jpg",
    alt: "Cachos coloridos em roxo com desenho freestyle na nuca",
    look: "Colorimetria · Freestyle",
  },
  {
    id: "05",
    src: "/images/portfolio/look-05.jpg",
    alt: "Crop platinado texturizado, fundo da mandala",
    look: "Colorimetria",
    mandala: true,
  },
  {
    id: "04",
    src: "/images/portfolio/look-04.jpg",
    alt: "Mullet loiro texturizado",
    look: "Colorimetria",
  },
];
