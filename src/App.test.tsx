import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
            duration_min: 45,
            tool: "tesoura",
            active: true,
            order: 1,
          },
          {
            id: 2,
            slug: "cor",
            name: "Cor",
            description: "Colorimetria",
            price: "160.00",
            duration_min: 120,
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
        ]),
      );
    }
    if (url.endsWith("/scheduling/bookings/create/")) {
      return Promise.resolve(
        mockJson({
          id: 21,
          start: "2026-07-02T14:00:00-03:00",
          end: "2026-07-02T15:00:00-03:00",
          status: "pending",
          total_price: "70.00",
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
    expect(screen.getByLabelText("Abrir menu").getAttribute("aria-expanded")).toBe("true");
  });

  test("renders client app panels for authenticated clients", async () => {
    mockMe("client");
    window.history.pushState({}, "", "/app");

    const { container } = render(<App />);

    expect(await screen.findByText(/Bem-vindo de volta/)).toBeTruthy();
    expect(await screen.findByText("Corte")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Planos" }));
    expect(await screen.findByText(/Assine e economize/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Hist/ }));
    expect(await screen.findByText(/Confirmado/)).toBeTruthy();
    expect(await screen.findByText(/Aguardando sinal/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Pagar sinal/ }));
    expect(await screen.findByText(/Copiar código PIX/)).toBeTruthy();
    expect(await screen.findByText(/BR\.GOV\.BCB\.PIX/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
    expect(await screen.findByRole("button", { name: /Confirmar/ })).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: /Corte/ }));
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-07-02" } });
    fireEvent.click(await screen.findByRole("button", { name: "14:00" }));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar/ }));
    expect(await screen.findByText(/Agendado/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Agendar outro" }));
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

    expect(await screen.findByText(/Bem-vindo de volta/)).toBeTruthy();
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

    const { container } = render(<App />);

    expect(await screen.findByText("Marcos")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Finalizar"));
    expect(await screen.findByText("Atendimento finalizado.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Cancelar"));
    expect(await screen.findByText("Horário cancelado.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Reagendar"));
    const rescheduleInput = container.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    fireEvent.change(rescheduleInput, { target: { value: "2026-07-03T10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Mover" }));
    expect(await screen.findByText("Horário reagendado.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Clientes" }));
    expect(await screen.findByText("Clientes na mão")).toBeTruthy();
    expect(await screen.findByText("Prata")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Fidelidade" }));
    expect(await screen.findByRole("heading", { name: "Níveis de fidelidade" })).toBeTruthy();
    expect(await screen.findByText("Criar nível")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Digite o nome"), { target: { value: "Ouro" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar nível/ }));
    expect(await screen.findByText("Nível de fidelidade criado.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Promos" }));
    expect(await screen.findByText("Promoções e brindes")).toBeTruthy();
    expect(await screen.findByText("Semana do degradado")).toBeTruthy();
    expect(await screen.findByText("Sobrancelha")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Digite o título"), { target: { value: "Quarta premium" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Promoção publicada.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Digite o brinde"), { target: { value: "Hidratacao" } });
    fireEvent.click(screen.getByRole("button", { name: "Liberar" }));
    expect(await screen.findByText("Brinde liberado.")).toBeTruthy();

    // Caixa (financeiro): margem, custos e recebimento
    fireEvent.click(screen.getByRole("button", { name: "Caixa" }));
    expect(await screen.findByText("Caixa do Bruxo")).toBeTruthy();
    expect(await screen.findByText("75%")).toBeTruthy();
    expect(await screen.findByText("Pomadas")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Lançar custo/ }));
    fireEvent.change(screen.getByPlaceholderText("Ex.: Pomadas, aluguel, energia"), {
      target: { value: "Aluguel" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lançar" }));
    expect(await screen.findByText("Custo lançado.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remover custo Pomadas"));
    expect(await screen.findByText("Custo removido.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("CPF, celular, e-mail ou chave aleatória"), {
      target: { value: "elcio@pix.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar recebimento" }));
    expect(await screen.findByText(/Recebimento salvo/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Site" }));
    expect(await screen.findByText("Controle do site")).toBeTruthy();

    // Fotos (sub-aba padrão): publicar, editar, ocultar e remover
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["img"], "look.jpg", { type: "image/jpeg" })] },
    });
    fireEvent.change(await screen.findByPlaceholderText("Ex.: Freestyle"), { target: { value: "Freestyle novo" } });
    fireEvent.change(screen.getByPlaceholderText("Ex.: Corte freestyle finalizado"), { target: { value: "Corte novo" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Imagem publicada no portfólio.")).toBeTruthy();
    fireEvent.click(await screen.findByLabelText("Editar Freestyle"));
    fireEvent.change(screen.getByLabelText("Look 1"), { target: { value: "Freestyle editado" } });
    fireEvent.change(screen.getByLabelText("Alt 1"), { target: { value: "Alt editado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Imagem atualizada.")).toBeTruthy();
    fireEvent.click(await screen.findByLabelText("Ocultar Freestyle"));
    expect(await screen.findByText("Imagem atualizada.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remover imagem"));
    expect(await screen.findByText("Imagem removida do portfólio.")).toBeTruthy();

    // Serviços
    fireEvent.click(screen.getByRole("button", { name: "Serviços" }));
    fireEvent.click(await screen.findByRole("button", { name: /Novo serviço/ }));
    fireEvent.change(screen.getByPlaceholderText("Digite o nome do serviço"), { target: { value: "Barba" } });
    fireEvent.change(screen.getByLabelText("Preço do serviço"), { target: { value: "55.00" } });
    fireEvent.change(screen.getByLabelText("Duração do serviço"), { target: { value: "35" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByText("Serviço publicado no site.")).toBeTruthy();
    fireEvent.click(await screen.findByLabelText("Editar Corte"));
    fireEvent.change(screen.getByLabelText("Preço Corte"), { target: { value: "75.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Serviço atualizado.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remover serviço"));
    expect(await screen.findByText("Serviço removido do site.")).toBeTruthy();

    // Planos
    fireEvent.click(screen.getByRole("button", { name: "Planos" }));
    fireEvent.click(await screen.findByRole("button", { name: /Novo plano/ }));
    fireEvent.change(screen.getByPlaceholderText("Digite o nome do plano"), { target: { value: "Mensal" } });
    fireEvent.change(screen.getByPlaceholderText("Ex.: 2 cortes + barba"), { target: { value: "2 cortes por mes" } });
    fireEvent.change(screen.getByLabelText("Preço antigo do plano"), { target: { value: "150.00" } });
    fireEvent.change(screen.getByLabelText("Preço atual do plano"), { target: { value: "120.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByText("Plano publicado no site.")).toBeTruthy();
    fireEvent.click(await screen.findByLabelText("Editar Ritual"));
    fireEvent.change(screen.getByLabelText("Plano Ritual"), { target: { value: "Ritual Plus" } });
    fireEvent.change(screen.getByLabelText("Itens Ritual"), { target: { value: "1 corte e barba" } });
    fireEvent.change(screen.getByLabelText("De Ritual"), { target: { value: "110.00" } });
    fireEvent.change(screen.getByLabelText("Por Ritual"), { target: { value: "90.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Plano atualizado.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remover plano"));
    expect(await screen.findByText("Plano removido do site.")).toBeTruthy();

    // Descontos
    fireEvent.click(screen.getByRole("button", { name: "Descontos" }));
    fireEvent.click(await screen.findByRole("button", { name: /Nova faixa/ }));
    fireEvent.change(screen.getByLabelText("Faixa de valor"), { target: { value: "R$200-250" } });
    fireEvent.change(screen.getByLabelText("Desconto da faixa"), { target: { value: "15% OFF" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByText("Faixa de desconto publicada.")).toBeTruthy();
    fireEvent.click(await screen.findByLabelText("Editar faixa 1"));
    fireEvent.change(screen.getByLabelText("Faixa 1"), { target: { value: "R$150-200" } });
    fireEvent.change(screen.getByLabelText("Desconto 1"), { target: { value: "12% OFF" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Faixa de desconto atualizada.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remover faixa"));
    expect(await screen.findByText("Faixa de desconto removida.")).toBeTruthy();
  });

  test("handles register mode from login page", async () => {
    mockMe(null);
    window.history.pushState({}, "", "/entrar");

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Criar conta" }));
    fireEvent.change(screen.getByPlaceholderText(/Usu/), { target: { value: "novo" } });
    fireEvent.change(screen.getByPlaceholderText("WhatsApp"), { target: { value: "62999990000" } });
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
