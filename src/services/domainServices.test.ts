import { afterEach, describe, expect, test, vi } from "vitest";

import { login, logout, register } from "./authService";
import {
  cancelBarberBooking,
  completeBarberBooking,
  getBarberBookings,
  getBarberCustomers,
  rescheduleBarberBooking,
} from "./barberService";
import { createLoyaltyTier, getLoyaltyTiers, getMyLoyalty, updateLoyaltyTier } from "./loyaltyService";
import {
  createGift,
  createPromotion,
  getActivePromotions,
  getAdminGifts,
  getAdminPromotions,
} from "./promotionsService";
import {
  createDiscountTier,
  createPlan,
  createPortfolioImage,
  createService,
  deletePortfolioImage,
  getAdminDiscountTiers,
  getAdminPlans,
  getAdminPortfolioImages,
  getAdminServices,
  getDiscountTiers,
  getPlans,
  getPortfolioImages,
  getServices,
  updateDiscountTier,
  updatePlan,
  updatePortfolioImage,
  updateService,
} from "./catalogService";
import { cancelMyBooking, getMyBookings } from "./schedulingService";

function mockJson(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

describe("domain services", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("auth service uses cookie endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJson({
        user: { id: 1, username: "barber", email: "", phone: "", role: "barber", date_joined: "2026-01-01T00:00:00Z" },
      }),
    );

    await login("barber", "secret");
    await register({ username: "barber", password: "secret" });
    await logout();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/auth/login/",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/auth/logout/",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
  });

  test("barber service maps agenda actions", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson([]));

    await getBarberBookings("2026-07-02");
    await getBarberCustomers();
    await completeBarberBooking(1);
    await cancelBarberBooking(1, "cliente avisou");
    await rescheduleBarberBooking(1, "2026-07-03T10:00:00-03:00");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/scheduling/barber/bookings/?date=2026-07-02",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/scheduling/barber/bookings/1/reschedule/",
      expect.objectContaining({ body: JSON.stringify({ new_start: "2026-07-03T10:00:00-03:00" }) }),
    );
  });

  test("loyalty service maps tier management", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson({}));

    await getMyLoyalty();
    await getLoyaltyTiers();
    await createLoyaltyTier({
      name: "Ouro",
      min_months: 6,
      min_completed_bookings_year: 8,
      discount_percent: "12.50",
      order: 2,
      active: true,
    });
    await updateLoyaltyTier(1, { active: false });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/loyalty/tiers/1/",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ active: false }) }),
    );
  });

  test("promotion service maps campaigns and gifts", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson([]));

    await getActivePromotions();
    await getAdminPromotions();
    await getAdminGifts();
    await createPromotion({
      title: "Semana",
      description: "Desconto",
      discount_percent: "10.00",
      starts_at: "2026-07-01T00:00:00Z",
      ends_at: "2026-08-01T00:00:00Z",
      active: true,
    });
    await createGift({
      client: 2,
      title: "Sobrancelha",
      description: "Brinde",
      valid_until: "2026-08-01T00:00:00Z",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/promotions/admin/gifts/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("scheduling service maps protected client actions", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson([]));

    await getMyBookings();
    await cancelMyBooking(8, "nao posso ir");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/scheduling/bookings/8/cancel/",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ reason: "nao posso ir" }) }),
    );
  });

  test("catalog service maps public and barber content management", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson([]));

    await getServices();
    await getPlans();
    await getDiscountTiers();
    await getPortfolioImages();
    await getAdminServices();
    await getAdminPlans();
    await getAdminDiscountTiers();
    await getAdminPortfolioImages();
    await createService({
      slug: "corte",
      name: "Corte",
      description: "Corte completo",
      price: "70.00",
      duration_min: 45,
      tool: "tesoura",
      active: true,
      order: 1,
    });
    await updateService(1, { price: "75.00" });
    await createPlan({
      slug: "ritual",
      name: "Ritual",
      items: "1 corte por mes",
      price_from: "100.00",
      price: "80.00",
      active: true,
      order: 1,
    });
    await updatePlan(1, { price: "85.00" });
    await createDiscountTier({ range_label: "R$100-150", discount_label: "10% OFF", active: true, order: 1 });
    await updateDiscountTier(1, { discount_label: "12% OFF" });
    await updatePortfolioImage(1, { look: "Freestyle" });
    await deletePortfolioImage(1);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/catalog/admin/services/1/",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ price: "75.00" }) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/catalog/admin/portfolio/1/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  test("catalog image upload sends multipart form data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson({ id: 1 }));
    const form = new FormData();
    form.append("image", new File(["img"], "look.jpg", { type: "image/jpeg" }));

    await createPortfolioImage(form);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/catalog/admin/portfolio/",
      expect.objectContaining({
        body: form,
        credentials: "include",
        headers: {},
        method: "POST",
      }),
    );
  });
});
