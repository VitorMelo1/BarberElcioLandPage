export interface Testimonial {
  id: string;
  name: string;
  text: string;
  tag?: string;
}

// Só depoimentos REAIS de clientes do Elcio. Enquanto vazio, a seção não aparece
// (nada de prova social inventada). Adicione entradas aqui quando tiver os reais.
export const testimonials: Testimonial[] = [];
