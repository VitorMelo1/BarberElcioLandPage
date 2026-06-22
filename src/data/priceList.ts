export interface PriceItem {
  name: string;
  price: string;
}
export interface PriceGroup {
  group: string;
  items: PriceItem[];
}

export const priceList: PriceGroup[] = [
  {
    group: "Cortes",
    items: [
      { name: "Masculino curto", price: "R$ 65" },
      { name: "Masculino médio/longo", price: "R$ 95" },
      { name: "Feminino", price: "R$ 95" },
    ],
  },
  {
    group: "Barba & rosto",
    items: [
      { name: "Barba", price: "R$ 45" },
      { name: "Sobrancelha (navalha)", price: "R$ 25" },
      { name: "Sobrancelha (pinça)", price: "R$ 35" },
      { name: "Limpeza de pele", price: "R$ 45" },
    ],
  },
  {
    group: "Cabelo & cor",
    items: [
      { name: "Finalização (cachos/escova)", price: "R$ 45" },
      { name: "Tratamento Wella avulso", price: "R$ 85" },
      { name: "Cronograma Wella (4x)", price: "R$ 300" },
      { name: "Coloração", price: "sob consulta" },
      { name: "Químicas (alisamento/selagem)", price: "a partir de R$ 100" },
      { name: "Freestyle", price: "a partir de R$ 5" },
    ],
  },
];
