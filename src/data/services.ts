/** Cada serviço mapeia para uma ferramenta 3D — isso dirige o ToolSwitcher na cena de Serviços. */
export type ToolId = "tesoura" | "navalha" | "pente" | "maquina";

export interface Service {
  id: string;
  tool: ToolId;
  title: string;
  description: string;
  price?: string;
}

export const services: Service[] = [
  {
    id: "corte",
    tool: "tesoura",
    title: "Corte Artístico",
    description: "Desenho de cada fio pensado pro seu rosto e estilo.",
  },
  {
    id: "colorimetria",
    tool: "pente",
    title: "Colorimetria",
    description: "Cor sob medida — do platinado ao fantasy, sem agredir o cabelo.",
  },
  {
    id: "freestyle",
    tool: "maquina",
    title: "Freestyle",
    description: "Desenhos e degradês livres na máquina. Sua assinatura na pele.",
  },
  {
    id: "barba",
    tool: "navalha",
    title: "Barba & Navalha",
    description: "Toalha quente, navalha e acabamento de barbearia clássica.",
  },
];
