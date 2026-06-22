import { useMediaQuery } from "./useMediaQuery";

/** true quando o usuário pediu movimento reduzido no sistema. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
