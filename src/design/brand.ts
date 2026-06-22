/** Tokens da marca em TS — espelho de styles/tokens.css, p/ uso no 3D e em JS. */
export const brand = {
  colors: {
    magenta: "#e8178a",
    purple: "#7b35c0",
    blue: "#4fc3f7",
    deepViolet: "#2d1b4e",
    bg: "#0d0a1a",
    bg2: "#1a0e2e",
    softViolet: "#9b6fd4",
    nearWhite: "#f0eaf8",
    midPurple: "#4a2080",
  },
  /** Ordem do gradiente assinatura (magenta -> roxo -> azul). */
  gradient: ["#e8178a", "#7b35c0", "#4fc3f7"] as const,
  fonts: {
    display: '"Cinzel Decorative", serif',
    heading: '"Cinzel", serif',
    body: '"Raleway", sans-serif',
  },
} as const;
