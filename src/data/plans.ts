export interface Plan {
  id: string;
  name: string; // nome temático (bruxaria)
  items: string; // composição
  from: number; // "de"
  price: number; // "por" (mensal)
}

export const plans: Plan[] = [
  { id: "feitico", name: "Feitiço", items: "1 corte · 1 barba · 1 sobrancelha · 1 hidratação", from: 185, price: 150 },
  { id: "ritual", name: "Ritual", items: "1 corte · 2 barbas · 2 sobrancelhas", from: 205, price: 165 },
  { id: "pocao", name: "Poção", items: "2 cortes · 2 barbas · 2 sobrancelhas", from: 270, price: 200 },
  { id: "conjuracao", name: "Conjuração", items: "1 corte · 4 barbas · 4 sobrancelhas", from: 345, price: 250 },
  { id: "alquimia", name: "Alquimia", items: "2 cortes · 4 barbas · 2 sobrancelhas", from: 360, price: 270 },
  { id: "grimorio", name: "Grimório", items: "4 cortes · 4 barbas · 4 sobrancelhas", from: 540, price: 380 },
];

export interface DiscountTier {
  range: string;
  discount: string;
}

/** "Monte seu plano" — desconto pela soma dos procedimentos no mês. */
export const buildYourPlan: DiscountTier[] = [
  { range: "R$110–150", discount: "10%" },
  { range: "R$150–200", discount: "15%" },
  { range: "R$200–250", discount: "20%" },
  { range: "R$250–300", discount: "25%" },
  { range: "acima de R$300", discount: "30%" },
];
