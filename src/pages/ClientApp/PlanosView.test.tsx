import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { PlanosView } from "./PlanosView";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
afterEach(() => { vi.restoreAllMocks(); document.cookie = "barder_csrf=; Max-Age=0; path=/"; });

test("client buys a plan and receives PIX without leaving the app", async () => {
  document.cookie = "barder_csrf=test-token; path=/";
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const path = String(url);
    if (path.includes("/catalog/plans/")) return json([{ id: 4, slug: "mensal", name: "Plano Mensal", items: "2 cortes", price_from: "160.00", price: "129.90", active: true, order: 0 }]);
    if (path.endsWith("/finance/plan-subscriptions/")) return json([]);
    if (path.endsWith("/finance/plans/4/subscribe/")) return json({
      subscription: { id: 8, plan: 4, plan_name: "Plano Mensal", plan_items: "2 cortes", amount: "129.90", status: "pending", starts_at: null, ends_at: null },
      auto: true, amount: "129.90", brcode: "PIX-PLANO-8", qr_code_base64: "", payment_status: "pending", external_reference: "plan-ref-8",
    }, 201);
    return json({});
  });

  render(<MemoryRouter><PlanosView /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Assinar Plano Mensal" }));

  expect(await screen.findByText("PIX-PLANO-8")).toBeTruthy();
  expect(screen.queryByRole("link", { name: /WhatsApp|Consultar este plano/ })).toBeNull();
  expect(screen.getByText(/renovação não é automática/i)).toBeTruthy();
});
