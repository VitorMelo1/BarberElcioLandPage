import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Crown,Gift,Eye,EyeOff,Globe,ImagePlus,Pencil,Plus,Trash2 } from "lucide-react";
import type { ApiService,ApiPlan,ApiDiscountTier,ApiPortfolioImage } from "../../services/catalogService";
import { moneyLabel,slugify,Skeleton,Empty,Field } from "./PanelPrimitives";
import styles from "./BarberApp.module.css";
import { FotosSection } from "./PortfolioManager";
import { ServicosSection } from "./ServicesManager";
import { PlanosSection } from "./PlansManager";
import { DescontosSection } from "./DiscountsManager";
type SiteSection = "fotos" | "servicos" | "planos" | "descontos";

const SITE_SECTIONS = [
  { id: "fotos", label: "Fotos" },
  { id: "servicos", label: "Serviços" },
  { id: "planos", label: "Planos" },
  { id: "descontos", label: "Descontos" },
] as const;

const SITE_HINTS: Record<SiteSection, string> = {
  fotos: "Fotos do portfólio do site público — adicione, edite, oculte ou remova.",
  servicos: "Cortes e preços que o cliente vê no site público e no agendamento.",
  planos: "Planos mensais que aparecem no site público e na aba Planos do cliente.",
  descontos: "Faixas de economia que ajudam o cliente a fechar plano.",
};

export function SiteContentPanel({
  services,
  plans,
  discounts,
  images,
  loading,
  onCreateService,
  onUpdateService,
  onDeleteService,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onCreateDiscount,
  onUpdateDiscount,
  onDeleteDiscount,
  onCreateImage,
  onUpdateImage,
  onDeleteImage,
}: {
  services: ApiService[];
  plans: ApiPlan[];
  discounts: ApiDiscountTier[];
  images: ApiPortfolioImage[];
  loading: boolean;
  onCreateService: (payload: Omit<ApiService, "id">) => Promise<boolean>;
  onUpdateService: (id: number, payload: Partial<Omit<ApiService, "id">>) => Promise<boolean>;
  onDeleteService: (id: number) => Promise<boolean>;
  onCreatePlan: (payload: Omit<ApiPlan, "id">) => Promise<boolean>;
  onUpdatePlan: (id: number, payload: Partial<Omit<ApiPlan, "id">>) => Promise<boolean>;
  onDeletePlan: (id: number) => Promise<boolean>;
  onCreateDiscount: (payload: Omit<ApiDiscountTier, "id">) => Promise<boolean>;
  onUpdateDiscount: (id: number, payload: Partial<Omit<ApiDiscountTier, "id">>) => Promise<boolean>;
  onDeleteDiscount: (id: number) => Promise<boolean>;
  onCreateImage: (payload: FormData) => Promise<boolean>;
  onUpdateImage: (
    id: number,
    payload: Partial<Omit<ApiPortfolioImage, "id" | "image" | "image_url">>,
  ) => Promise<boolean>;
  onDeleteImage: (id: number) => Promise<boolean>;
}) {
  const [params, setParams] = useSearchParams();
  const section = (["fotos","servicos","planos","descontos"].includes(params.get("section") || "") ? params.get("section") : "fotos") as SiteSection;
  const setSection = (value: SiteSection) => setParams(previous => { previous.set("section",value); return previous; });
  const counts: Record<SiteSection, number> = {
    fotos: images.length,
    servicos: services.length,
    planos: plans.length,
    descontos: discounts.length,
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <p className={styles.panelEyebrow}>Vitrine</p>
          <h2 className={styles.panelTitle}>Site e preços</h2><a className={styles.btnGhost} href="/" target="_blank" rel="noreferrer">Ver site público</a>
        </div>
      </div>

      <div className={styles.subnav} role="group" aria-label="Seções do site">
        {SITE_SECTIONS.map((s) => (
          <button
            key={s.id}
            className={section === s.id ? styles.subTabOn : styles.subTab}
            onClick={() => setSection(s.id)}
            aria-label={s.label}
            aria-pressed={section === s.id}
          >
            {s.label}
            <i>{counts[s.id]}</i>
          </button>
        ))}
      </div>
      <p className={styles.sectionHint}>{SITE_HINTS[section]}</p><fieldset className={styles.formBoundary} disabled={loading}>

      {loading && <Skeleton />}

      {section === "fotos" && (
        <FotosSection images={images} onCreate={onCreateImage} onUpdate={onUpdateImage} onDelete={onDeleteImage} />
      )}
      {section === "servicos" && (
        <ServicosSection
          services={services}
          loading={loading}
          onCreate={onCreateService}
          onUpdate={onUpdateService}
          onDelete={onDeleteService}
        />
      )}
      {section === "planos" && (
        <PlanosSection
          plans={plans}
          loading={loading}
          onCreate={onCreatePlan}
          onUpdate={onUpdatePlan}
          onDelete={onDeletePlan}
        />
      )}
      {section === "descontos" && (
        <DescontosSection
          discounts={discounts}
          loading={loading}
          onCreate={onCreateDiscount}
          onUpdate={onUpdateDiscount}
          onDelete={onDeleteDiscount}
        />
      )}
    </fieldset></section>
  );
}

/* ── Fotos ── */

