import { useEffect, useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";

import { getBookingPix, type BookingPix } from "../../services/financeService";
import { getMyBookings, type Booking } from "../../services/schedulingService";
import styles from "./ClientApp.module.css";

const STATUS: Record<string, string> = {
  pending: "Aguardando sinal",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  noshow: "Não compareceu",
};

const money = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export function MeusHorariosView() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [pixFor, setPixFor] = useState<number | null>(null);
  const [pix, setPix] = useState<BookingPix | null>(null);
  const [pixError, setPixError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => setBookings([]));
  }, []);

  async function openPix(id: number) {
    if (pixFor === id) {
      setPixFor(null);
      return;
    }
    setPixFor(id);
    setPix(null);
    setPixError("");
    setCopied(false);
    try {
      setPix(await getBookingPix(id));
    } catch (err) {
      setPixError(err instanceof Error ? err.message : "Não deu pra gerar o PIX.");
    }
  }

  async function copyCode() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.brcode);
      setCopied(true);
    } catch {
      setPixError("Não deu pra copiar sozinho — segura no código e copia manualmente.");
    }
  }

  if (!bookings) return <p className={styles.muted}>Carregando…</p>;
  if (bookings.length === 0)
    return <p className={styles.muted}>Você ainda não tem agendamentos. Bora marcar? ✂️</p>;

  return (
    <div className={styles.view}>
      <div className={styles.list}>
        {bookings.map((b) => (
          <div key={b.id} className={styles.bookingWrap}>
            <div className={styles.booking}>
              <div className={styles.bookingInfo}>
                <b>
                  {new Date(b.start).toLocaleString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </b>
                <small>R$ {Number(b.total_price).toFixed(0)}</small>
              </div>
              <span className={styles.badge}>{STATUS[b.status] || b.status}</span>
              {b.status === "pending" && (
                <button className={styles.pixBtn} onClick={() => void openPix(b.id)}>
                  <QrCode size={15} /> Pagar sinal
                </button>
              )}
            </div>

            {pixFor === b.id && (
              <div className={styles.pixBox}>
                {pixError && <p className={styles.muted}>{pixError}</p>}
                {pix && (
                  <>
                    <p className={styles.pixTitle}>
                      Pague o sinal de <b>{money(pix.amount)}</b> pra garantir o horário
                    </p>
                    <code className={styles.pixCode}>{pix.brcode}</code>
                    <button className={styles.cta} onClick={() => void copyCode()}>
                      {copied ? (
                        <>
                          <Check size={15} /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={15} /> Copiar código PIX
                        </>
                      )}
                    </button>
                    <small className={styles.muted}>
                      Cole no app do seu banco em PIX → Copia e Cola · recebedor: {pix.holder}
                    </small>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
