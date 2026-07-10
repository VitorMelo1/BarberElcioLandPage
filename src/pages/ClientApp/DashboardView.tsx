import { useEffect, useState } from "react";
import {
  CalendarPlus,
  ChevronRight,
  Clock,
  Gift,
  MapPin,
  Palette,
  Scissors,
  Sparkles,
  Star,
} from "lucide-react";

import { getServices, type ApiService } from "../../services/catalogService";
import { getMyBookings, type Booking } from "../../services/schedulingService";
import styles from "./ClientApp.module.css";

function svcIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("cor")) return Palette;
  if (n.includes("freestyle") || n.includes("desenho")) return Sparkles;
  return Scissors;
}

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const WEEK = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function DashboardView({
  onAgendar,
  onHistorico,
}: {
  onAgendar: () => void;
  onHistorico: () => void;
}) {
  const [services, setServices] = useState<ApiService[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => {});
    getMyBookings()
      .then(setBookings)
      .catch(() => {});
  }, []);

  const upcoming = bookings
    .filter((b) => new Date(b.start) >= new Date() && ["pending", "confirmed"].includes(b.status))
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const next = upcoming[0];

  return (
    <div className={styles.dash}>
      {/* Ações rápidas */}
      <div className={styles.actions}>
        <button className={styles.action} onClick={onAgendar}>
          <CalendarPlus size={20} />
          <span>
            <b>Agendar horário</b>
            <small>Escolha data e horário</small>
          </span>
        </button>
        <button className={styles.action} onClick={onHistorico}>
          <Clock size={20} />
          <span>
            <b>Ver histórico</b>
            <small>Seus agendamentos</small>
          </span>
        </button>
      </div>

      <div className={styles.dashGrid}>
        {/* Próximo agendamento */}
        <section className={`${styles.panel} ${styles.nextPanel}`}>
          <h3 className={styles.panelTitle}>Seu próximo agendamento ✦</h3>
          {next ? (
            <div className={styles.next}>
              <div className={styles.dateCircle}>
                <span className={styles.dateWeek}>{WEEK[new Date(next.start).getDay()]}</span>
                <span className={styles.dateDay}>{new Date(next.start).getDate()}</span>
                <span className={styles.dateMonth}>{MONTHS[new Date(next.start).getMonth()]}</span>
              </div>
              <div className={styles.nextInfo}>
                <p className={styles.nextService}>
                  <Scissors size={15} /> Atendimento no Studio
                </p>
                <p className={styles.nextLine}>
                  <Clock size={14} />
                  {new Date(next.start).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · R$ {Number(next.total_price).toFixed(0)}
                </p>
                <p className={styles.nextLine}>
                  <MapPin size={14} /> Rua Cristóvão Campos, 257
                </p>
                <span className={styles.statusPill}>
                  {next.status === "pending" ? "Aguardando sinal" : "Confirmado"}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.empty}>
              <p>Nenhum agendamento marcado ainda.</p>
              <button className={styles.cta} onClick={onAgendar}>
                Agendar agora
              </button>
            </div>
          )}
        </section>

        {/* Pontos / fidelidade (em breve) */}
        <section className={`${styles.panel} ${styles.pointsPanel}`}>
          <h3 className={styles.panelTitle}>Seus pontos</h3>
          <p className={styles.points}>0</p>
          <p className={styles.muted}>O programa de fidelidade do Bruxo chega em breve. ✦</p>
        </section>

        {/* Serviços */}
        <section className={`${styles.panel} ${styles.servicesPanel}`}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Nossos serviços</h3>
            <button className={styles.seeAll} onClick={onAgendar}>
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.svcGrid}>
            {services.slice(0, 4).map((s) => {
              const Icon = svcIcon(s.name);
              return (
                <button key={s.id} className={styles.svcCard} onClick={onAgendar}>
                  <span className={styles.svcIcon}>
                    <Icon size={22} />
                  </span>
                  <b>{s.name}</b>
                  <small>R$ {Number(s.price).toFixed(0)}</small>
                </button>
              );
            })}
          </div>
        </section>

        {/* Próximos agendamentos */}
        <section className={`${styles.panel} ${styles.listPanel}`}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Próximos agendamentos</h3>
            <button className={styles.seeAll} onClick={onHistorico}>
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className={styles.muted}>Sem agendamentos futuros.</p>
          ) : (
            <div className={styles.miniList}>
              {upcoming.slice(0, 3).map((b) => (
                <div key={b.id} className={styles.miniRow}>
                  <span className={styles.miniDate}>
                    {new Date(b.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <span className={styles.miniInfo}>
                    Atendimento
                    <small>R$ {Number(b.total_price).toFixed(0)}</small>
                  </span>
                  <span className={styles.miniTime}>
                    {new Date(b.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Profissional */}
        <section className={`${styles.panel} ${styles.proPanel}`}>
          <h3 className={styles.panelTitle}>Seu barbeiro</h3>
          <div className={styles.pro}>
            <img src="/images/barber.jpg" alt="Elcio" className={styles.proPhoto} />
            <div>
              <b className={styles.proName}>Elcio — o Bruxo</b>
              <span className={styles.proTag}>
                <Star size={12} /> Especialista
              </span>
              <p className={styles.muted}>Cortes, barbas e transformações.</p>
            </div>
          </div>
        </section>

        {/* Promo */}
        <section className={`${styles.panel} ${styles.promoPanel}`}>
          <Gift size={20} className={styles.promoIcon} />
          <h3 className={styles.promoTitle}>Terça do Bruxo</h3>
          <p className={styles.promoText}>20% OFF em cortes — toda terça-feira.</p>
          <button className={styles.cta} onClick={onAgendar}>
            Aproveitar
          </button>
        </section>
      </div>
    </div>
  );
}
