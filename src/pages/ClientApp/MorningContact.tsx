import styles from "./ClientApp.module.css";

export const isOnlineSlot = (start: string) => new Date(start).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }) >= "11:00";

export function MorningContact({ subject, day }: { subject: string; day?: string }) {
  const date = day ? ` no dia ${day.split("-").reverse().join("/")}` : "";
  const message = `Olá, Elcio! Quero combinar um horário pela manhã (das 8h às 11h) para ${subject}${date}. Tem disponibilidade?`;
  return <aside className={styles.morningContact}>
    <div><strong>Prefere vir de manhã?</strong><p>Das 8h às 11h, consulte o Elcio pelo WhatsApp. O horário só fica combinado depois que ele responder.</p></div>
    <a className={styles.secondary} href={`https://wa.me/5562993397680?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Consultar manhã pelo WhatsApp</a>
  </aside>;
}
