import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Crown,Gift,Eye,EyeOff,Globe,ImagePlus,Pencil,Plus,Trash2 } from "lucide-react";
import type { ApiService,ApiPlan,ApiDiscountTier,ApiPortfolioImage } from "../../services/catalogService";
import { moneyLabel,slugify,Skeleton,Empty,Field } from "./PanelPrimitives";
import styles from "./BarberApp.module.css";
export function ServicosSection({
  services,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  services: ApiService[];
  loading: boolean;
  onCreate: (payload: Omit<ApiService, "id">) => Promise<boolean>;
  onUpdate: (id: number, payload: Partial<Omit<ApiService, "id">>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("70.00");
  const [duration, setDuration] = useState(45);
  const [quote, setQuote] = useState(false);
  const [specialty, setSpecialty] = useState<NonNullable<ApiService['specialty']>>("");

  return (
    <>
      {!creating && (
        <button className={styles.ghostAdd} onClick={() => setCreating(true)}>
          <Plus size={16} /> Novo serviço
        </button>
      )}
      {creating && (
        <form
          className={styles.editorForm}
          onSubmit={async (event) => {
            event.preventDefault();
            const finalName = name || "Novo serviço";
            if (!await onCreate({
              slug: slugify(finalName),
              name: finalName,
              description: "Serviço criado pelo painel do barbeiro.",
              price: quote ? "0" : price,
              price_type: quote ? "quote" : "fixed",
              specialty,
              duration_min: duration,
              tool: "tesoura",
              active: true,
              order: services.length + 1,
            })) return;
            setName("");
            setQuote(false);
            setSpecialty("");
            setCreating(false);
          }}
        >
          <div className={styles.formHeader}>
            <Plus size={16} />
            <strong>Novo serviço</strong>
          </div>
          <Field label="Nome que aparece no site" hint="Ex.: Corte masculino curto">
            <input
              placeholder="Digite o nome do serviço"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <QuoteToggle value={quote} onChange={setQuote} />
          <SpecialtyField value={specialty} onChange={setSpecialty} />
          <div className={styles.formRow}>
            {!quote && (
              <Field label="Preço">
                <input aria-label="Preço do serviço" value={price} onChange={(event) => setPrice(event.target.value)} />
              </Field>
            )}
            <Field label={quote ? "Duração da avaliação em minutos" : "Duração em minutos"}>
              <input
                aria-label={quote ? "Duração da avaliação" : "Duração do serviço"}
                type="number"
                min={5}
                max={480}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
              />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button type="submit" className={styles.btn}>
              Adicionar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      {!loading && services.length === 0 && (
        <Empty icon={<Globe size={26} />} text="Nenhum serviço publicado ainda." />
      )}
      <div className={styles.rows}>
        {services.map((service) => (
          <ServiceRow key={service.id} service={service} onSave={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </>
  );
}

function QuoteToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className={value ? styles.quoteSwitchOn : styles.quoteSwitch}
      onClick={() => onChange(!value)}
      aria-pressed={value}
    >
      <span className={styles.quoteSwitchDot} />
      Sob consulta (colorimetria / avaliação)
    </button>
  );
}

function SpecialtyField({ value, onChange }: { value: NonNullable<ApiService['specialty']>; onChange: (value: NonNullable<ApiService['specialty']>) => void }) {
  return <Field label="Especialidade artística" hint="Liga este serviço à especialidade mostrada no site."><select aria-label="Especialidade artística" value={value} onChange={event => onChange(event.target.value as NonNullable<ApiService['specialty']>)}><option value="">Sem especialidade artística</option><option value="freestyle">Freestyle</option><option value="colorimetry">Colorimetria</option></select></Field>;
}

function ServiceRow({
  service,
  onSave,
  onDelete,
}: {
  service: ApiService;
  onSave: (id: number, payload: Partial<Omit<ApiService, "id">>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(service.price);
  const [duration, setDuration] = useState(service.duration_min);
  const [quote, setQuote] = useState(service.price_type === "quote");
  const [specialty, setSpecialty] = useState<NonNullable<ApiService['specialty']>>(service.specialty || "");

  return (
    <article className={styles.row}>
      <div className={styles.rowTop}>
        <div className={styles.rowMain}>
          <b>{service.name}</b>
          <small>{service.price_type === "quote" ? "Avaliação: " : ""}{service.duration_min} min{service.specialty ? ` · ${service.specialty === 'freestyle' ? 'Freestyle' : 'Colorimetria'}` : ''}</small>
        </div>
        <strong className={styles.rowPrice}>
          {service.price_type === "quote" ? "Sob consulta" : moneyLabel(service.price)}
        </strong>
        <div className={styles.rowActions}><span className={styles.pillLive}>{service.active ? "Publicado" : "Oculto"}</span><button className={styles.btnGhost} onClick={() => void onSave(service.id, {active: !service.active})}>{service.active ? "Ocultar" : "Reativar"}</button>
          <button
            className={styles.iconBtn}
            onClick={() => setEditing((value) => !value)}
            aria-label={`Editar ${service.name}`}
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            className={styles.iconBtnDanger}
            onClick={() => { if (window.confirm("Ocultar este item do site? Você poderá reativá-lo aqui.")) void onDelete(service.id); }}
            aria-label="Remover serviço"
            title="Remover"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {editing && (
        <div className={styles.rowEdit}>
          <Field label="Nome no site">
            <input value={name} onChange={(event) => setName(event.target.value)} aria-label={`Nome ${service.name}`} />
          </Field>
          <QuoteToggle value={quote} onChange={setQuote} />
          <SpecialtyField value={specialty} onChange={setSpecialty} />
          <div className={styles.editGrid}>
            {!quote && (
              <Field label="Preço">
                <input value={price} onChange={(event) => setPrice(event.target.value)} aria-label={`Preço ${service.name}`} />
              </Field>
            )}
            <Field label={quote ? "Duração da avaliação" : "Duração"}>
              <input
                type="number"
                min={5}
                max={480}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                aria-label={`${quote ? "Duração da avaliação" : "Duração"} ${service.name}`}
              />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button
              type="button"
              className={styles.btnSmall}
              onClick={async () => {
                if (!await onSave(service.id, {
                  name,
                  price: quote ? "0" : price,
                  price_type: quote ? "quote" : "fixed",
                  specialty,
                  duration_min: duration,
                })) return;
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => { setName(service.name); setPrice(service.price); setDuration(service.duration_min); setQuote(service.price_type === "quote"); setSpecialty(service.specialty || ""); setEditing(false); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ── Planos ── */

