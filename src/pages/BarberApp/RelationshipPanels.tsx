import { useState } from "react";
import { Crown,Gift,Plus,Trophy } from "lucide-react";
import type { BarberCustomer } from "../../services/barberService";
import type { LoyaltyTier } from "../../services/loyaltyService";
import type { Promotion,ClientGift } from "../../services/promotionsService";
import { Skeleton,Empty,Field } from "./PanelPrimitives";
import { localDate } from "./formatters";
import styles from "./BarberApp.module.css";
export function LoyaltyPanel({
  tiers,
  loading,
  onCreate,
  onUpdate,
}: {
  tiers: LoyaltyTier[];
  loading: boolean;
  onCreate: (payload: Omit<LoyaltyTier, "id">) => Promise<boolean>;
  onUpdate: (id:number,payload:Partial<LoyaltyTier>)=>Promise<boolean>;
}) {
  const [editing,setEditing] = useState<LoyaltyTier|null>(null);
  const [name, setName] = useState("");
  const [months, setMonths] = useState(1);
  const [bookings, setBookings] = useState(3);
  const [discount, setDiscount] = useState("5.00");

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <p className={styles.panelEyebrow}>Recorrência</p>
          <h2 className={styles.panelTitle}>Níveis de fidelidade</h2>
        </div>
      </div>

      <form
        className={styles.editorForm}
        onSubmit={async (event) => {
          event.preventDefault();
          const payload = {
            name: name.trim(),
            min_months: months,
            min_completed_bookings_year: bookings,
            discount_percent: discount,
            order: editing?.order ?? tiers.length + 1,
            active: editing?.active ?? true,
          };
          if(!await (editing ? onUpdate(editing.id,payload) : onCreate(payload)))return;
          setEditing(null);setName("");
        }}
      >
        <div className={styles.formHeader}>
          <Plus size={16} />
          <strong>{editing ? "Editar nível" : "Novo nível"}</strong>
        </div>
        <Field label="Nome do nível" hint="Ex.: Aprendiz, Feiticeiro, Bruxo Supremo">
          <input required placeholder="Digite o nome" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <div className={styles.formRow}>
          <Field label="Meses de casa">
            <input type="number" min={0} value={months} onChange={(event) => setMonths(Number(event.target.value))} />
          </Field>
          <Field label="Cortes no ano">
            <input type="number" min={0} value={bookings} onChange={(event) => setBookings(Number(event.target.value))} />
          </Field>
          <Field label="Desconto %">
            <input required type="number" min="0" max="100" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} />
          </Field>
        </div>
        <button type="submit" className={styles.btn} disabled={loading}>
          {editing ? "Salvar nível" : "Criar nível"}
        </button>
        {editing&&<button type="button" className={styles.btnGhost} onClick={()=>{setEditing(null);setName("");setMonths(1);setBookings(3);setDiscount("5.00");}}>Cancelar edição</button>}
      </form>

      {loading && <Skeleton />}
      {!loading && tiers.length === 0 && (
        <Empty icon={<Trophy size={26} />} text="Nenhum nível criado ainda. Monte a escada de fidelidade." />
      )}
      <div className={styles.tierList}>
        {tiers.map((tier, index) => (
          <article className={styles.tierCard} key={tier.id}>
            <span className={styles.tierRank}>{index + 1}</span>
            <div className={styles.tierInfo}>
              <h3>{tier.name}</h3>
              <p>
                {tier.min_months} meses de casa · {tier.min_completed_bookings_year} cortes no ano
              </p>
            </div>
            <strong className={styles.tierDiscount}>{Number(tier.discount_percent)}%</strong><span>{tier.active?"Ativo":"Pausado"}</span><div className={styles.rowActions}><button className={styles.btnGhost} disabled={loading} aria-label={`Editar ${tier.name}`} onClick={()=>{setEditing(tier);setName(tier.name);setMonths(tier.min_months);setBookings(tier.min_completed_bookings_year);setDiscount(tier.discount_percent);}}>Editar</button><button className={styles.btnGhost} disabled={loading} onClick={()=>void onUpdate(tier.id,{active:!tier.active})}>{tier.active?"Pausar":"Reativar"}</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── PROMOÇÕES ─────────────────── */

export function PromotionsPanel({
  promotions,
  gifts,
  customers,
  loading,
  onCreatePromotion,
  onCreateGift,
  onUpdatePromotion,
  onUpdateGift,
}: {
  promotions: Promotion[];
  gifts: ClientGift[];
  customers: BarberCustomer[];
  loading: boolean;
  onCreatePromotion: (payload: Omit<Promotion, "id">) => Promise<boolean>;
  onCreateGift: (payload: Pick<ClientGift, "client" | "title" | "description" | "valid_until">) => Promise<boolean>;
  onUpdatePromotion:(id:number,payload:Partial<Promotion>)=>Promise<boolean>;
  onUpdateGift:(id:number,payload:Partial<ClientGift>)=>Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("10.00");
  const [giftTitle, setGiftTitle] = useState("");
  const [client, setClient] = useState(0);

  const [editingPromotion,setEditingPromotion]=useState<Promotion|null>(null);
  const [editingGift,setEditingGift]=useState<ClientGift|null>(null);
  const [description,setDescription]=useState("");
  const [giftDescription,setGiftDescription]=useState("");
  const [starts,setStarts]=useState(localDate());
  const [ends,setEnds]=useState(localDate(new Date(Date.now()+30*86400000)));
  const [giftUntil,setGiftUntil]=useState(localDate(new Date(Date.now()+45*86400000)));


  const firstCustomer = client;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <p className={styles.panelEyebrow}>Venda rápida</p>
          <h2 className={styles.panelTitle}>Promoções e brindes</h2>
        </div>
      </div>

      <div className={styles.formPair}>
        <form
          className={styles.editorForm}
          onSubmit={async (event) => {
            event.preventDefault();
            const payload = {
              title: title.trim(),
              description,
              discount_percent: discount,
              starts_at: new Date(`${starts}T00:00:00`).toISOString(),
              ends_at: new Date(`${ends}T23:59:59`).toISOString(),
              active: editingPromotion?.active ?? true,
            };
            if(!await (editingPromotion ? onUpdatePromotion(editingPromotion.id,payload) : onCreatePromotion(payload)))return;
            setEditingPromotion(null);setTitle("");setDescription("");
          }}
        >
          <div className={styles.formHeader}>
            <Gift size={16} />
            <strong>{editingPromotion ? "Editar promoção" : "Nova promoção"}</strong>
          </div>
          <Field label="Título da campanha" hint="Ex.: Terça do Bruxo">
            <input required placeholder="Digite o título" value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Condições da campanha"><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2}/></Field>
          <div className={styles.formRow}><Field label="Início da promoção"><input required type="date" value={starts} onChange={e=>setStarts(e.target.value)}/></Field><Field label="Fim da promoção"><input required type="date" min={starts} value={ends} onChange={e=>setEnds(e.target.value)}/></Field></div>
          <div className={styles.formRow}>
            <Field label="Desconto %">
              <input required type="number" min="0" max="100" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} aria-label="Desconto da promoção" />
            </Field>
            <button type="submit" className={styles.btn} disabled={loading}>
              {editingPromotion ? "Salvar promoção" : "Publicar"}
            </button>
          </div>
          {editingPromotion&&<button type="button" className={styles.btnGhost} onClick={()=>{setEditingPromotion(null);setTitle("");setDescription("");}}>Cancelar edição</button>}
        </form>

        <form
          className={styles.editorForm}
          onSubmit={async (event) => {
            event.preventDefault();
            if (!firstCustomer) return;
            const payload = {
              client: firstCustomer,
              title: giftTitle.trim(),
              description:giftDescription,
              valid_until: new Date(`${giftUntil}T23:59:59`).toISOString(),
            };
            if(!await (editingGift ? onUpdateGift(editingGift.id,payload) : onCreateGift(payload)))return;
            setEditingGift(null);setGiftTitle("");setGiftDescription("");setClient(0);
          }}
        >
          <div className={styles.formHeader}>
            <Crown size={16} />
            <strong>{editingGift ? "Editar brinde" : "Brinde para cliente"}</strong>
          </div>
          <Field label="Nome do brinde" hint="Ex.: Sobrancelha por conta da casa">
            <input required placeholder="Digite o brinde" value={giftTitle} onChange={(event) => setGiftTitle(event.target.value)} />
          </Field>
          <Field label="Condições do brinde"><textarea rows={2} value={giftDescription} onChange={e=>setGiftDescription(e.target.value)}/></Field>
          <Field label="Validade do brinde"><input required type="date" min={localDate()} value={giftUntil} onChange={e=>setGiftUntil(e.target.value)}/></Field>
          <div className={styles.formRow}>
            <Field label="Cliente">
              <select value={firstCustomer} onChange={(event) => setClient(Number(event.target.value))}>
                <option value={0}>Selecione o cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.username}
                  </option>
                ))}
              </select>
            </Field>
            <button type="submit" className={styles.btn} disabled={loading || !firstCustomer}>
              {editingGift ? "Salvar brinde" : "Liberar"}
            </button>
          </div>
          {editingGift&&<button type="button" className={styles.btnGhost} onClick={()=>{setEditingGift(null);setGiftTitle("");setClient(0);setGiftDescription("");}}>Cancelar edição</button>}
        </form>
      </div>

      {loading && <Skeleton />}
      {!loading && promotions.length === 0 && gifts.length === 0 && (
        <Empty icon={<Gift size={26} />} text="Nenhuma campanha cadastrada. Crie uma promoção ou escolha um cliente para receber um brinde." />
      )}
      <div className={styles.promoGrid}>
        {promotions.map((promotion) => (
          <article className={styles.promoCard} key={promotion.id}>
            <span className={styles.promoBadge}>{Number(promotion.discount_percent)}% OFF</span>
            <h3>{promotion.title}</h3>
            <div className={styles.rowActions}><button className={styles.btnGhost} disabled={loading} onClick={()=>{setEditingPromotion(promotion);setTitle(promotion.title);setDescription(promotion.description);setDiscount(promotion.discount_percent);setStarts(localDate(new Date(promotion.starts_at)));setEnds(localDate(new Date(promotion.ends_at)));}}>Editar promoção</button><button className={styles.btnGhost} disabled={loading} onClick={()=>void onUpdatePromotion(promotion.id,{active:!promotion.active})}>{promotion.active?"Pausar":"Reativar"}</button></div><p>{promotion.description}</p><p>{!promotion.active ? "Pausada" : new Date(promotion.ends_at).getTime()<Date.now()?"Encerrada":new Date(promotion.starts_at).getTime()>Date.now()?"Programada":"Ativa"} · Até {new Date(promotion.ends_at).toLocaleDateString("pt-BR")}</p>
          </article>
        ))}
        {gifts.map((gift) => (
          <article className={styles.giftCard} key={gift.id}>
            <span className={styles.giftBadge}>
              <Crown size={12} /> Brinde
            </span>
            <h3>{gift.title}</h3>
            <p>{gift.client_username || `Cliente #${gift.client}`}</p><p>{gift.used_at ? `Utilizado em ${new Date(gift.used_at).toLocaleDateString("pt-BR")}` : new Date(gift.valid_until).getTime()<Date.now()?"Vencido":`Válido até ${new Date(gift.valid_until).toLocaleDateString("pt-BR")}`}</p>
            {!gift.used_at&&<div className={styles.rowActions}><button disabled={loading} className={styles.btnGhost} onClick={()=>{setEditingGift(gift);setGiftTitle(gift.title);setGiftDescription(gift.description);setClient(gift.client);setGiftUntil(localDate(new Date(gift.valid_until)));}}>Editar brinde</button>{new Date(gift.valid_until).getTime()>Date.now()&&<button disabled={loading} className={styles.btnGhost} onClick={()=>{if(window.confirm(`Registrar utilização de ${gift.title} para ${gift.client_username || 'este cliente'}?`))void onUpdateGift(gift.id,{used_at:new Date().toISOString()});}}>Registrar uso</button>}</div>}
          </article>
        ))}
      </div>
    </section>
  );
}

