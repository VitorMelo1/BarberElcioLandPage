import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { PaymentPanel } from "./PaymentPanel";

const NOW = new Date("2026-09-13T12:00:00Z");
const pix = { auto: true, brcode: "PIX-ANTIGO", amount: "32.50", qr_code_base64: "cW9kZQ==", deposit_paid: false, expires_at: "2026-09-13T13:00:00Z" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(NOW);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  document.cookie = "barder_csrf=test-token; path=/";
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); document.cookie = "barder_csrf=; Max-Age=0; path=/"; });

test.each([
  { requires_review: true, payment_status: "approved", status: "confirmed" },
  { requires_review: false, payment_status: "refunded", status: "confirmed" },
  { requires_review: false, payment_status: "charged_back", status: "pending" },
  { requires_review: false, payment_status: "rejected", status: "pending" },
  { requires_review: false, payment_status: "pending", status: "cancelled" },
])("removes payment instructions when reconciliation becomes unsafe: %j", async result => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => String(url).endsWith("/pix/") ? json(pix) : json({ ...result, deposit_paid: false }));
  await act(async () => { render(<PaymentPanel bookingId={1} onPaid={vi.fn()} />); });
  expect(screen.getByText("PIX-ANTIGO")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Já paguei, consultar" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(screen.queryByText("PIX-ANTIGO")).toBeNull();
  expect(screen.queryByRole("img", { name: /QR code/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /Copiar código PIX/ })).toBeNull();
  expect(screen.getByRole("link", { name: "Falar com o studio" })).toBeTruthy();
});

test("an open payment expires without user interaction and reconciles before issuing a replacement", async () => {
  const calls: string[] = [];
  let emissions = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => {
    const path = String(url); calls.push(path);
    if (path.endsWith("/pix/")) return json(++emissions === 1 ? { ...pix, expires_at: "2026-09-13T12:00:05Z" } : { ...pix, brcode: "PIX-NOVO" });
    return json({ deposit_paid: false, status: "pending", payment_status: "expired", expires_at: "2026-09-13T12:00:05Z" });
  });
  await act(async () => { render(<PaymentPanel bookingId={1} onPaid={vi.fn()} />); });
  expect(screen.getByText("PIX-ANTIGO")).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(5_001); });
  expect(screen.queryByText("PIX-ANTIGO")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Consultar nova cobrança" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(calls.map(path => path.split("/").filter(Boolean).slice(-1)[0])).toEqual(["pix", "payment-status", "pix"]);
  expect(screen.getByText("PIX-NOVO")).toBeTruthy();
});

test("failed expiry reconciliation keeps the old QR hidden and allows retry", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => String(url).endsWith("/pix/") ? json({ ...pix, expires_at: "2026-09-13T11:00:00Z" }) : json({ detail: "Provedor indisponível" }, 503));
  await act(async () => { render(<PaymentPanel bookingId={1} onPaid={vi.fn()} />); });
  fireEvent.click(screen.getByRole("button", { name: "Consultar nova cobrança" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(screen.queryByText("PIX-ANTIGO")).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("Provedor indisponível");
  expect((screen.getByRole("button", { name: "Consultar nova cobrança" }) as HTMLButtonElement).disabled).toBe(false);
});

test("reopening an expired charge reconciles the rejected emission before requesting a replacement", async () => {
  const calls: string[] = [];
  let emissions = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => {
    const path = String(url); calls.push(path);
    if (path.endsWith("/pix/")) return ++emissions === 1 ? json({ detail: "Consulte a cobrança anterior" }, 400) : json({ ...pix, brcode: "PIX-RENOVADO" });
    return json({ deposit_paid: false, status: "pending", payment_status: "expired" });
  });
  await act(async () => { render(<PaymentPanel bookingId={1} onPaid={vi.fn()} />); });
  expect(calls.map(path => path.split("/").filter(Boolean).slice(-1)[0])).toEqual(["pix", "payment-status", "pix"]);
  expect(screen.getByText("PIX-RENOVADO")).toBeTruthy();
});

test("reopening a refunded charge never emits another PIX", async () => {
  let emissions = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => {
    if (String(url).endsWith("/pix/")) { emissions++; return json({ detail: "Cobrança bloqueada" }, 400); }
    return json({ deposit_paid: false, requires_review: true, status: "confirmed", payment_status: "approved" });
  });
  await act(async () => { render(<PaymentPanel bookingId={1} onPaid={vi.fn()} />); });
  expect(emissions).toBe(1);
  expect(screen.getByText(/Evite pagar novamente/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Copiar código PIX/ })).toBeNull();
});

test("expiration during a slow status check releases the renewal button", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    if (String(url).endsWith("/pix/")) return json({ ...pix, expires_at: "2026-09-13T12:00:11Z" });
    return new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
  });
  await act(async () => { render(<PaymentPanel bookingId={1} onPaid={vi.fn()} />); });
  await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
  expect(screen.getByRole("button", { name: "Conferindo…" })).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(1_001); });
  expect((screen.getByRole("button", { name: "Consultar nova cobrança" }) as HTMLButtonElement).disabled).toBe(false);
});

test("keeps PIX available when the local clock is ahead but the server says the hold remains", async () => {
  vi.setSystemTime(new Date("2099-09-13T12:00:00Z"));
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(pix));
  await act(async () => { render(<PaymentPanel bookingId={1} holdExpiresAt="2026-09-13T11:59:59Z" holdExpiresInSeconds={300} onPaid={vi.fn()} />); });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText("PIX-ANTIGO")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Copiar código PIX/ })).toBeTruthy();
});

test("reloads the booking when PIX emission reports an expired hold", async () => {
  const onExpired = vi.fn();
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => String(url).endsWith("/pix/")
    ? json({ code: "booking_hold_expired", detail: "A retenção venceu." }, 400)
    : json({ deposit_paid: false, status: "pending", payment_status: null }));
  await act(async () => { render(<PaymentPanel bookingId={1} holdExpiresInSeconds={300} onPaid={vi.fn()} onExpired={onExpired} />); });
  expect(onExpired).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/retenção deste horário venceu/i)).toBeTruthy();
});

test("refreshes the booking after the provider confirms the deposit", async () => {
  const onPaid = vi.fn();
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => String(url).endsWith("/pix/")
    ? json(pix)
    : json({ deposit_paid: true, status: "confirmed", payment_status: "approved" }));
  await act(async () => { render(<PaymentPanel bookingId={1} onPaid={onPaid} />); });
  fireEvent.click(screen.getByRole("button", { name: "Já paguei, consultar" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(onPaid).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Sinal recebido/)).toBeTruthy();
});
