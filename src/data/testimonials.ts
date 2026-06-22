export interface Testimonial {
  id: string;
  name: string;
  text: string;
  tag?: string;
}

// ⚠️ SAMPLE — substituir por depoimentos reais de clientes do Elcio.
export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Lucas M.",
    text: "Saí da cadeira parecendo outra pessoa. O Elcio entendeu exatamente o que eu queria.",
    tag: "Corte + barba",
  },
  {
    id: "2",
    name: "Rafa",
    text: "A colorimetria ficou perfeita, sem fritar o cabelo. Não troco mais de barbeiro.",
    tag: "Colorimetria",
  },
  {
    id: "3",
    name: "João P.",
    text: "Freestyle de outro nível. As pessoas param na rua pra perguntar onde cortei.",
    tag: "Freestyle",
  },
];
