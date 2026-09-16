const ZONE = "America/Sao_Paulo";
export const money = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
export const depositAmount = (value: string | number) => Math.ceil(Math.round(Number(value) * 100) / 2) / 100;
export const time = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: ZONE, hour: "2-digit", minute: "2-digit" });
export const appointmentDate = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: ZONE, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export function localDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function nextDays(count = 7) {
  const today = localDate();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(`${today}T12:00:00-03:00`);
    date.setUTCDate(date.getUTCDate() + i);
    return { iso: localDate(date), label: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : date.toLocaleDateString("pt-BR", { timeZone: ZONE, weekday: "short" }).replace(".", ""), sub: date.toLocaleDateString("pt-BR", { timeZone: ZONE, day: "2-digit", month: "2-digit" }) };
  });
}
