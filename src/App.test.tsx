import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import App from "./App";

function mockJson(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

function mockMe(role: "client" | "barber" | null) {
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    if (url.endsWith("/auth/csrf/")) return Promise.resolve(mockJson({ csrfToken: "masked-test-token" }));
    if (url.endsWith("/auth/refresh/")) return Promise.resolve(mockJson({ detail: "Sessão encerrada" }, 401));
    if (url.endsWith("/auth/me/") && role) {
      return Promise.resolve(
        mockJson({
          id: 1,
          username: role === "barber" ? "elcio" : "cliente",
          email: "",
          phone: "",
          role,
          date_joined: "2026-01-01T00:00:00Z",
        }),
      );
    }
    if (url.endsWith("/auth/me/")) {
      return Promise.resolve(mockJson({ detail: "unauthorized" }, 401));
    }
    if (url.endsWith("/auth/login/")) {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const loginRole = body.username === "barber" ? "barber" : "client";
      return Promise.resolve(
        mockJson({
          user: {
            id: 1,
            username: loginRole === "barber" ? "barber" : "cliente",
            email: "",
            phone: "",
            role: loginRole,
            date_joined: "2026-01-01T00:00:00Z",
          },
        }),
      );
    }
    if (url.endsWith("/auth/register/") || url.endsWith("/auth/logout/")) {
      return Promise.resolve(mockJson({ ok: true }));
    }
    if (url.includes("/catalog/services/")) {
      return Promise.resolve(
        mockJson([
          {
            id: 1,
            slug: "corte",
            name: "Corte",
            description: "Corte completo",
            price: "70.00",
            price_type: "fixed",
            duration_min: 45,
            tool: "tesoura",
            active: true,
            order: 1,
          },
          {
            id: 3,
            slug: "colorimetria",
            name: "Colorimetria",
            description: "Sob avaliação",
            price: "0.00",
            price_type: "quote",
            duration_min: 30,
            tool: "pincel",
            active: true,
            order: 2,
          },
        ]),
      );
    }
    if (url.includes("/catalog/plans/")) {
      return Promise.resolve(
        mockJson([
          {
            id: 1,
            slug: "ritual",
            name: "Ritual",
            items: "1 corte por mes",
            price_from: "100.00",
            price: "80.00",
            active: true,
            order: 1,
          },
        ]),
      );
    }
    if (url.includes("/catalog/discount-tiers/")) {
      return Promise.resolve(
        mockJson([{ id: 1, range_label: "R$100-150", discount_label: "10% OFF", active: true, order: 1 }]),
      );
    }
    if (url.includes("/catalog/portfolio/")) {
      return Promise.resolve(
        mockJson([
          {
            id: 1,
            image: "/media/portfolio/look.jpg",
            image_url: "http://127.0.0.1:8000/media/portfolio/look.jpg",
            alt: "Corte freestyle",
            look: "Freestyle",
            mandala: false,
            active: true,
            order: 1,
          },
        ]),
      );
    }
    if (url.includes("/catalog/admin/services/")) {
      if (init?.method === "DELETE") return Promise.resolve(mockJson(null, 204));
      return Promise.resolve(
        mockJson([
          {
            id: 1,
            slug: "corte",
            name: "Corte",
            description: "Corte completo",
            price: "70.00",
            price_type: "fixed",
            duration_min: 45,
            tool: "tesoura",
            active: true,
            order: 1,
          },
        ]),
      );
    }
    if (url.includes("/catalog/admin/plans/")) {
      if (init?.method === "DELETE") return Promise.resolve(mockJson(null, 204));
      return Promise.resolve(
        mockJson([
          {
            id: 1,
            slug: "ritual",
            name: "Ritual",
            items: "1 corte por mes",
            price_from: "100.00",
            price: "80.00",
            active: true,
            order: 1,
          },
        ]),
      );
    }
    if (url.includes("/catalog/admin/discount-tiers/")) {
      if (init?.method === "DELETE") return Promise.resolve(mockJson(null, 204));
      return Promise.resolve(
        mockJson([{ id: 1, range_label: "R$100-150", discount_label: "10% OFF", active: true, order: 1 }]),
      );
    }
    if (url.includes("/catalog/admin/portfolio/")) {
      if (init?.method === "DELETE") return Promise.resolve(mockJson(null, 204));
      return Promise.resolve(
        mockJson([
          {
            id: 1,
            image: "/media/portfolio/look.jpg",
            image_url: "http://127.0.0.1:8000/media/portfolio/look.jpg",
            alt: "Corte freestyle",
            look: "Freestyle",
            mandala: false,
            active: true,
            order: 1,
          },
        ]),
      );
    }
    if (url.includes("/scheduling/slots/")) {
      return Promise.resolve(
        mockJson({
          date: "2026-07-02",
          duration_min: 45,
          slots: ["2026-07-02T14:00:00-03:00"],
        }),
      );
    }
    if (url.includes("/scheduling/barber/calendar/")) {
      const t = new Date();
      const dayIso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      return Promise.resolve(
        mockJson({
          year: t.getFullYear(),
          month: t.getMonth() + 1,
          days: [{ date: dayIso, weekday: (t.getDay() + 6) % 7, is_open: true, blocked: false, bookings: 1 }],
        }),
      );
    }
    if (url.includes("/scheduling/barber/working-hours/")) {
      const labels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
      return Promise.resolve(
        mockJson(
          labels.map((label, i) => ({
            weekday: i,
            weekday_label: label,
            is_open: i !== 6,
            opens_at: "09:00:00",
            closes_at: "19:00:00",
          })),
        ),
      );
    }
    if (url.includes("/scheduling/barber/blackouts/")) {
      if (init?.method === "POST") {
        return Promise.resolve(
          mockJson({ id: 3, start: "2026-07-02T12:00:00-03:00", end: "2026-07-02T13:00:00-03:00", reason: "almoço" }, 201),
        );
      }
      if (init?.method === "DELETE") return Promise.resolve(mockJson(null, 204));
      return Promise.resolve(mockJson([]));
    }
    if (url.includes("/scheduling/barber/bookings/")) {
      return Promise.resolve(
        mockJson([
          {
            id: 10,
            start: "2026-07-02T14:00:00-03:00",
            end: "2026-07-02T15:00:00-03:00",
            status: "scheduled",
            total_price: "80.00",
            client_username: "Marcos",
            client_phone: "62999990000",
          },
          {
            id: 30,
            start: "2026-07-02T16:00:00-03:00",
            end: "2026-07-02T16:30:00-03:00",
            status: "quote",
            total_price: "0.00",
            client_username: "Bruna",
            client_phone: "62988880000",
            notes: "quero platinar",
          },
        ]),
      );
    }
    if (url.includes("/reschedule-slots/")) {
      return Promise.resolve(
        mockJson({ date: "2026-07-03", slots: ["2026-07-03T14:00:00-03:00"] }),
      );
    }
    if (url.endsWith("/scheduling/bookings/create/")) {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const quote = Array.isArray(body.service_ids) && body.service_ids.includes(3);
      return Promise.resolve(
        mockJson({
          id: 21,
          start: "2026-07-02T14:00:00-03:00",
          end: "2026-07-02T15:00:00-03:00",
          status: quote ? "quote" : "pending",
          total_price: quote ? "0.00" : "70.00",
        }),
      );
    }
    if (url.includes("/scheduling/bookings/")) {
      return Promise.resolve(
        mockJson([
          {
            id: 20,
            start: "2099-07-02T14:00:00-03:00",
            end: "2099-07-02T15:00:00-03:00",
            status: "confirmed",
            total_price: "70.00",
          },
          {
            id: 22,
            start: "2099-07-03T14:00:00-03:00",
            end: "2099-07-03T15:00:00-03:00",
            status: "pending",
            total_price: "70.00",
          },
        ]),
      );
    }
    if (url.includes("/finance/summary/")) {
      return Promise.resolve(
        mockJson({
          year: 2026,
          month: 7,
          revenue: "200.00",
          expenses: "50.00",
          profit: "150.00",
          margin: 75.0,
          completed_count: 1,
          series: [
            { label: "Fev", revenue: "0.00", expenses: "0.00", profit: "0.00" },
            { label: "Mar", revenue: "0.00", expenses: "0.00", profit: "0.00" },
            { label: "Abr", revenue: "0.00", expenses: "0.00", profit: "0.00" },
            { label: "Mai", revenue: "0.00", expenses: "0.00", profit: "0.00" },
            { label: "Jun", revenue: "120.00", expenses: "30.00", profit: "90.00" },
            { label: "Jul", revenue: "200.00", expenses: "50.00", profit: "150.00" },
          ],
          breakdown: [{ name: "Corte", count: 1, total: "200.00" }],
        }),
      );
    }
    if (url.includes("/finance/expenses/")) {
      if (init?.method === "POST") {
        return Promise.resolve(
          mockJson({ id: 9, name: "Aluguel", amount: "800.00", incurred_on: "2026-07-01" }, 201),
        );
      }
      if (init?.method === "DELETE") return Promise.resolve(mockJson(null, 204));
      return Promise.resolve(
        mockJson([{ id: 5, name: "Pomadas", amount: "40.00", incurred_on: "2026-07-02" }]),
      );
    }
    if (url.includes("/finance/settings/")) {
      return Promise.resolve(
        mockJson({
          pix_key: "62999990000",
          pix_holder: "Elcio",
          pix_city: "ANAPOLIS",
          mercadopago_configured: false,
        }),
      );
    }
    if (url.includes("/finance/bookings/") && url.includes("/pix/")) {
      return Promise.resolve(
        mockJson({
          brcode: "00020126580014BR.GOV.BCB.PIX0136MOCK6304ABCD",
          amount: "35.00",
          holder: "Elcio",
          deposit_paid: false,
        }),
      );
    }
    if (url.includes("/integrations/google/status/")) {
      return Promise.resolve(mockJson({ configured: false, connected: false, email: "" }));
    }
    if (url.includes("/scheduling/barber/customers/")) {
      return Promise.resolve(
        mockJson([
          {
            id: 2,
            username: "Marcos",
            email: "",
            phone: "62999990000",
            completed_bookings_year: 5,
            total_bookings: 8,
            loyalty: {
              months_active: 7,
              completed_bookings_year: 5,
              tier: { id: 1, name: "Prata", discount_percent: "7.50" },
            },
          },
        ]),
      );
    }
    if (url.includes("/loyalty/tiers/")) {
      return Promise.resolve(
        mockJson([{ id: 1, name: "Prata", min_months: 3, min_completed_bookings_year: 4, discount_percent: "7.50", order: 1, active: true }]),
      );
    }
    if (url.includes("/promotions/admin/promotions/")) {
      return Promise.resolve(
        mockJson([{ id: 1, title: "Semana do degradado", description: "Corte com desconto", discount_percent: "10.00", starts_at: "2026-07-01T00:00:00Z", ends_at: "2026-08-01T00:00:00Z", active: true }]),
      );
    }
    if (url.includes("/promotions/admin/gifts/")) {
      return Promise.resolve(
        mockJson([{ id: 1, client: 2, client_username: "Marcos", title: "Sobrancelha", description: "Brinde", valid_until: "2026-08-01T00:00:00Z", used_at: null, created_at: "2026-07-01T00:00:00Z" }]),
      );
    }
    return Promise.resolve(mockJson([]));
  });
}

describe("App routes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  test("redirects anonymous users away from the client app", async () => {
    mockMe(null);
    window.history.pushState({}, "", "/app");

    render(<App />);

    expect(await screen.findByText("Bem-vindo de volta")).toBeTruthy();
    expect(window.location.pathname).toBe("/entrar");
  });

  test("renders landing page and opens mobile menu", async () => {
    mockMe(null);
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(await screen.findByText("BRUXO DOS CABELOS")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Abrir menu"));
    expect(screen.getByLabelText("Fechar menu").getAttribute("aria-expanded")).toBe("true");
  });

  test("renders client app panels for authenticated clients", async () => {
    mockMe("client");
    window.history.pushState({}, "", "/app");

    render(<App />);

    // Início = marcação rápida: serviços aparecem de cara
    expect(await screen.findByRole("heading", { name: "Olá, cliente." })).toBeTruthy();
    expect(await screen.findByText("Corte")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Planos" }));
    expect(await screen.findByText(/Assine e pague por PIX/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Meus horários" }));
    expect(await screen.findByText(/Confirmado/)).toBeTruthy();
    expect(await screen.findByText(/Aguardando confirmação/)).toBeTruthy();
    fireEvent.click(within(screen.getByText("Aguardando confirmação").closest("article")!).getByRole("button", { name: /Pagar sinal/ }));
    expect(await screen.findByText(/Copiar código PIX/)).toBeTruthy();
    expect(await screen.findByText(/BR\.GOV\.BCB\.PIX/)).toBeTruthy();

    // Marcação rápida: serviço → chip de dia → chip de horário → confirmar
    fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
    fireEvent.click(await screen.findByText("Corte"));
    fireEvent.click(await screen.findByRole("button", { name: /Hoje/ }));
    fireEvent.click(await screen.findByRole("button", { name: "14:00" }));
    fireEvent.click(screen.getByRole("button", { name: /Reservar e gerar PIX/ }));
    expect(await screen.findByText("Horário reservado")).toBeTruthy();

    // Colorimetria = avaliação separada do procedimento
    fireEvent.click(screen.getByRole("button", { name: "Marcar outro" }));
    fireEvent.click(await screen.findByText("Colorimetria"));
    expect(await screen.findByText(/Você está marcando uma avaliação/)).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: /Hoje/ }));
    fireEvent.click(await screen.findByRole("button", { name: "14:00" }));
    fireEvent.click(screen.getByRole("button", { name: /Agendar avaliação/ }));
    expect(await screen.findByText("Avaliação marcada!")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Marcar outro" }));
    fireEvent.click(screen.getByLabelText("Sair"));
    await waitFor(() => expect(window.location.pathname).toBe("/entrar"));
  });

  test("redirects anonymous users away from barber panel", async () => {
    mockMe(null);
    window.history.pushState({}, "", "/barber");

    render(<App />);

    expect(await screen.findByText("Bem-vindo de volta")).toBeTruthy();
    expect(window.location.pathname).toBe("/entrar");
  });

  test("redirects client users from barber panel to the client app", async () => {
    mockMe("client");
    window.history.pushState({}, "", "/barber");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Olá, cliente." })).toBeTruthy();
    await waitFor(() => expect(window.location.pathname).toBe("/app"));
  });

  test("renders barber panel for barber users", async () => {
    mockMe("barber");
    window.history.pushState({}, "", "/barber");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Bruxo dos Cabelos" })).toBeTruthy();
  });

  test("lets barber navigate operational panels", async () => {
    mockMe("barber");
    window.history.pushState({}, "", "/barber");
    render(<App />);

    expect(await screen.findByText("Marcos")).toBeTruthy();
    expect(await screen.findByText("Bruna")).toBeTruthy();
    expect(screen.getByLabelText("Data da agenda")).toBeTruthy();
    // Pending reservations cannot be finalized until confirmed and started.
    expect(screen.queryByRole("button", { name: "Finalizar" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clientes" }));
    expect(await screen.findByLabelText("Buscar por nome, telefone ou e-mail")).toBeTruthy();
    expect(await screen.findByText(/Prata/)).toBeTruthy();
    expect(new URLSearchParams(window.location.search).get("tab")).toBe("clientes");

    fireEvent.click(screen.getByRole("button", { name: "Caixa" }));
    expect(await screen.findByRole("heading", { name: "Resultado do período" })).toBeTruthy();
    expect(await screen.findByText("75%")).toBeTruthy();
    expect(await screen.findByText("Pomadas")).toBeTruthy();
    expect(screen.queryByLabelText("Chave PIX")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ajustes" }));
    expect(await screen.findByRole("heading", { name: "Níveis de fidelidade" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Promoções" }));
    expect(await screen.findByText("Semana do degradado")).toBeTruthy();
    expect(await screen.findByText("Sobrancelha")).toBeTruthy();
    expect((screen.getByLabelText("Cliente") as HTMLSelectElement).value).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "Site & Preços" }));
    expect(await screen.findByRole("heading", { name: "Site e preços" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Serviços" }));
    expect(await screen.findByLabelText("Editar Corte")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Planos" }));
    expect(await screen.findByLabelText("Editar Ritual")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Descontos" }));
    expect(await screen.findByLabelText("Editar faixa 1")).toBeTruthy();
    expect(new URLSearchParams(window.location.search).get("section")).toBe("descontos");

    fireEvent.click(screen.getByRole("button", { name: "Pagamentos" }));
    expect(await screen.findByRole("heading", { name: "Recebimento por PIX" })).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Editar recebimento" }));
    expect(screen.getByLabelText("Chave PIX")).toBeTruthy();
  });

  test("handles register mode from login page", async () => {
    mockMe(null);
    window.history.pushState({}, "", "/entrar");

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Criar conta" }));
    fireEvent.change(screen.getByPlaceholderText(/Usu/), { target: { value: "novo" } });
    fireEvent.change(screen.getByLabelText("WhatsApp (opcional)"), { target: { value: "62999990000" } });
    fireEvent.change(screen.getByPlaceholderText("Senha"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    const createButtons = screen.getAllByRole("button", { name: "Criar conta" });
    fireEvent.click(createButtons[createButtons.length - 1]);

    await waitFor(() => expect(window.location.pathname).toBe("/app"));
  });

  test("sends barber users to the barber panel after login", async () => {
    mockMe(null);
    window.history.pushState({}, "", "/entrar");

    render(<App />);

    fireEvent.change(await screen.findByPlaceholderText(/Usu/), { target: { value: "barber" } });
    fireEvent.change(screen.getByPlaceholderText("Senha"), { target: { value: "secret123" } });
    const enterButtons = screen.getAllByRole("button", { name: "Entrar" });
    fireEvent.click(enterButtons[enterButtons.length - 1]);

    await waitFor(() => expect(window.location.pathname).toBe("/barber"));
    expect(await screen.findByRole("heading", { name: "Bruxo dos Cabelos" })).toBeTruthy();
  });
});
