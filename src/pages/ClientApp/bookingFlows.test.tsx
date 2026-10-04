import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { AgendarView } from "./AgendarView";
import { MeusHorariosView } from "./MeusHorariosView";
import { ReschedulePanel } from "./ReschedulePanel";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const service = { id: 1, name: "Corte", slug: "corte", description: "Acabamento completo", price: "70.50", price_type: "fixed", duration_min: 45, active: true, order: 0, tool: "tesoura" };
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); sessionStorage.clear(); document.cookie = "barder_csrf=; Max-Age=0; path=/"; });

test("a slow previous day never replaces slots for the selected day", async () => {
  let resolveOld!: (value: Response) => void;
  let slotRequests = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    if (String(url).includes("/catalog/services/")) return json([service]);
    if (String(url).includes("/scheduling/slots/")) {
      slotRequests += 1;
      if (slotRequests === 1) return new Promise<Response>(resolve => { resolveOld = resolve; });
      return json({ slots: ["2026-12-21T16:00:00-03:00"] });
    }
    return json([]);
  });
  render(<MemoryRouter><AgendarView /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: /Corte/ }));
  fireEvent.click(screen.getByRole("button", { name: /Hoje/ }));
  await waitFor(() => expect(slotRequests).toBe(1));
  fireEvent.click(screen.getByRole("button", { name: /Amanhã/ }));
  await screen.findByRole("button", { name: "16:00" });
  await act(async () => { resolveOld(json({ slots: ["2026-12-20T10:00:00-03:00"] })); });
  expect(screen.queryByRole("button", { name: "10:00" })).toBeNull();
  expect(screen.getByRole("button", { name: "16:00" })).toBeTruthy();
});

test("cancel requires confirmation before changing an appointment", async () => {
  let cancellations = 0;
  document.cookie = "barder_csrf=test-token; path=/";
  const booking = { id: 1, start: "2026-12-20T10:00:00-03:00", end: "2026-12-20T10:45:00-03:00", status: "pending", total_price: "70.50", services: [service], can_client_change: true };
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    if (String(url).endsWith("/cancel/")) { cancellations += 1; return json({ ...booking, status: "cancelled" }); }
    return json([booking]);
  });
  render(<MemoryRouter><MeusHorariosView /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
  expect(cancellations).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
  await waitFor(() => expect(cancellations).toBe(1));
});

test("failed history can be retried and never appears as empty history", async () => {
  let attempts = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    if (++attempts === 1) throw new TypeError("offline");
    return json([]);
  });
  render(<MemoryRouter><MeusHorariosView /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText(/ainda não tem agendamentos/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText(/ainda não tem agendamentos/)).toBeTruthy();
});

test("deposit estimate uses cents and rounds half a cent up across combined services", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json([{ ...service, price: "70.11" }, { ...service, id: 2, name: "Barba", price: "45.12" }]));
  render(<MemoryRouter><AgendarView /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: /Corte/ }));
  fireEvent.click(screen.getByRole("button", { name: /Barba/ }));
  expect(screen.getByText(/Sinal de 50%: R\$\s*57,62/)).toBeTruthy();
  expect(screen.getByText(/Serviços com preço definido ficam retidos por 15 minutos e só são confirmados após o sinal/)).toBeTruthy();
});

test("morning availability is arranged on WhatsApp instead of booked online", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => String(url).includes("/catalog/services/")
    ? json([service])
    : json({ date: "2099-10-02", duration_min: 45, slots: ["2099-10-02T09:00:00-03:00", "2099-10-02T11:00:00-03:00"] }));
  render(<MemoryRouter><AgendarView /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: /Corte/ }));
  fireEvent.click(screen.getByRole("button", { name: /Amanhã/ }));
  expect(await screen.findByRole("button", { name: "11:00" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "09:00" })).toBeNull();
  const link = screen.getByRole("link", { name: "Consultar manhã pelo WhatsApp" }) as HTMLAnchorElement;
  expect(decodeURIComponent(link.href)).toContain("Quero combinar um horário pela manhã");
  expect(decodeURIComponent(link.href)).toContain("Corte");
});

test("a client cannot reschedule into the WhatsApp-only morning", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ date: "2099-10-02", slots: ["2099-10-02T09:00:00-03:00", "2099-10-02T11:00:00-03:00"] }));
  render(<MemoryRouter><ReschedulePanel bookingId={9} duration={45} onSaved={() => {}} /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Outra data"), { target: { value: "2099-10-02" } });
  expect(await screen.findByRole("button", { name: "11:00" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "09:00" })).toBeNull();
  expect(screen.getByRole("link", { name: "Consultar manhã pelo WhatsApp" })).toBeTruthy();
});

test("a pending procedure shows the server hold deadline and refreshes when it expires", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-13T12:00:00Z"));
  const pending = {
    id: 1, start: "2026-12-20T10:00:00-03:00", end: "2026-12-20T10:45:00-03:00", status: "pending",
    total_price: "70.50", services: [service], can_client_change: true, deposit_paid: false,
    hold_expires_at: "2026-09-13T12:05:00Z", hold_expires_in_seconds: 300,
  };
  let reads = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(++reads === 1 ? [pending] : [{ ...pending, status: "cancelled" }]));
  await act(async () => { render(<MemoryRouter><MeusHorariosView /></MemoryRouter>); });
  expect(screen.getByText(/Pague o sinal até 13\/09\/2026, 09:05/)).toBeTruthy();
  expect(screen.queryByText(/Restam \d{2}:\d{2}/)).toBeNull();
  expect(screen.getByRole("button", { name: "Pagar sinal" })).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(300_001); });
  expect(reads).toBe(2);
  expect(screen.getByText("Cancelado")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Pagar sinal" })).toBeNull();
});

test("a fast local clock does not hide payment while the server hold has time left", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2099-09-13T12:00:00Z"));
  const pending = {
    id: 2, start: "2099-12-20T10:00:00-03:00", end: "2099-12-20T10:45:00-03:00", status: "pending",
    total_price: "70.50", services: [service], can_client_change: true, deposit_paid: false,
    hold_expires_at: "2026-09-13T12:05:00Z", hold_expires_in_seconds: 300,
  };
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json([pending]));
  await act(async () => { render(<MemoryRouter><MeusHorariosView /></MemoryRouter>); });
  expect(screen.getByText(/Pague o sinal até 13\/09\/2026, 09:05/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Pagar sinal" })).toBeTruthy();
});
