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
    id: "09",
    src: "/images/portfolio/look-09.jpg",
    alt: "Freestyle com estampa de leopardo no cabelo",
    look: "Freestyle",
  },
  {
    id: "08",
    src: "/images/portfolio/look-08.jpg",
    alt: "Colorimetria rosa pink em mullet",
    look: "Colorimetria",
  },
  {
    id: "05",
    src: "/images/portfolio/look-05.jpg",
    alt: "Crop platinado texturizado, fundo da mandala",
    look: "Colorimetria",
    mandala: true,
  },
  {
    id: "12",
    src: "/images/portfolio/look-12.jpg",
    alt: "Freestyle azul em raios sobre fade",
    look: "Freestyle",
  },
  {
    id: "10",
    src: "/images/portfolio/look-10.jpg",
    alt: "Crespo curto colorido em rosa pink",
    look: "Colorimetria",
  },
  {
    id: "11",
    src: "/images/portfolio/look-11.jpg",
    alt: "Loiro platinado em mullet texturizado",
    look: "Colorimetria",
  },
  {
    id: "03",
    src: "/images/portfolio/look-03.jpg",
    alt: "Cachos coloridos em roxo com desenho freestyle na nuca",
    look: "Colorimetria · Freestyle",
  },
  {
    id: "13",
    src: "/images/portfolio/look-13.jpg",
    alt: "Cabelo azul vibrante com desenho freestyle",
    look: "Freestyle",
  },
];
