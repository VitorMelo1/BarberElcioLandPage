import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Crown,Gift,Eye,EyeOff,Globe,ImagePlus,Pencil,Plus,Trash2 } from "lucide-react";
import type { ApiService,ApiPlan,ApiDiscountTier,ApiPortfolioImage } from "../../services/catalogService";
import { moneyLabel,slugify,Skeleton,Empty,Field } from "./PanelPrimitives";
import styles from "./BarberApp.module.css";
export function PlanosSection({
  plans,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  plans: ApiPlan[];
  loading: boolean;
  onCreate: (payload: Omit<ApiPlan, "id">) => Promise<boolean>;
  onUpdate: (id: number, payload: Partial<Omit<ApiPlan, "id">>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [items, setItems] = useState("1 corte por mês");
  const [priceFrom, setPriceFrom] = useState("100.00");
  const [price, setPrice] = useState("80.00");

  return (
    <>
      {!creating && (
        <button className={styles.ghostAdd} onClick={() => setCreating(true)}>
          <Plus size={16} /> Novo plano
        </button>
      )}
      {creating && (
        <form
          className={styles.editorForm}
          onSubmit={async (event) => {
            event.preventDefault();
            const finalName = name || "Novo plano";
            if (!await onCreate({
              slug: slugify(finalName),
              name: finalName,
              items,
              price_from: priceFrom,
              price,
              active: true,
              order: plans.length + 1,
            })) return;
            setName("");
            setCreating(false);
          }}
        >
          <div className={styles.formHeader}>
            <Plus size={16} />
            <strong>Novo plano</strong>
          </div>
          <Field label="Nome do plano" hint="Ex.: Mensal do Bruxo">
            <input
              placeholder="Digite o nome do plano"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="O que vem incluso">
            <input
              placeholder="Ex.: 2 cortes + barba"
              value={items}
              onChange={(event) => setItems(event.target.value)}
            />
          </Field>
          <div className={styles.formRow}>
            <Field label="Preço sem plano">
              <input
                aria-label="Preço antigo do plano"
                value={priceFrom}
                onChange={(event) => setPriceFrom(event.target.value)}
              />
            </Field>
            <Field label="Preço do plano">
              <input
                aria-label="Preço atual do plano"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
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
      {!loading && plans.length === 0 && <Empty icon={<Crown size={26} />} text="Nenhum plano publicado ainda." />}
      <div className={styles.rows}>
        {plans.map((plan) => (
          <PlanRow key={plan.id} plan={plan} onSave={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </>
  );
}

function PlanRow({
  plan,
  onSave,
  onDelete,
}: {
  plan: ApiPlan;
  onSave: (id: number, payload: Partial<Omit<ApiPlan, "id">>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [items, setItems] = useState(plan.items);
  const [priceFrom, setPriceFrom] = useState(plan.price_from);
  const [price, setPrice] = useState(plan.price);

  return (
    <article className={styles.row}>
      <div className={styles.rowTop}>
        <div className={styles.rowMain}>
          <b>{plan.name}</b>
          <small>{plan.items}</small>
        </div>
        <strong className={styles.rowPrice}>{moneyLabel(plan.price)}</strong>
        <div className={styles.rowActions}><span className={styles.pillLive}>{plan.active ? "Publicado" : "Oculto"}</span><button className={styles.btnGhost} onClick={() => void onSave(plan.id, {active: !plan.active})}>{plan.active ? "Ocultar" : "Reativar"}</button>
          <button
            className={styles.iconBtn}
            onClick={() => setEditing((value) => !value)}
            aria-label={`Editar ${plan.name}`}
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            className={styles.iconBtnDanger}
            onClick={() => { if (window.confirm("Ocultar este item do site? Você poderá reativá-lo aqui.")) void onDelete(plan.id); }}
            aria-label="Remover plano"
            title="Remover"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {editing && (
        <div className={styles.rowEdit}>
          <Field label="Nome do plano">
            <input value={name} onChange={(event) => setName(event.target.value)} aria-label={`Plano ${plan.name}`} />
          </Field>
          <Field label="Itens inclusos">
            <input value={items} onChange={(event) => setItems(event.target.value)} aria-label={`Itens ${plan.name}`} />
          </Field>
          <div className={styles.editGrid}>
            <Field label="Sem plano">
              <input
                value={priceFrom}
                onChange={(event) => setPriceFrom(event.target.value)}
                aria-label={`De ${plan.name}`}
              />
            </Field>
            <Field label="Com plano">
              <input value={price} onChange={(event) => setPrice(event.target.value)} aria-label={`Por ${plan.name}`} />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button
              type="button"
              className={styles.btnSmall}
              onClick={async () => {
                if (!await onSave(plan.id, { name, items, price_from: priceFrom, price })) return;
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => { setName(plan.name); setItems(plan.items); setPriceFrom(plan.price_from); setPrice(plan.price); setEditing(false); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ── Descontos ── */

