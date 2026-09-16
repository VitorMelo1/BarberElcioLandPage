import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { api } from "../services/api";

const user = { id: 1, username: "cliente", role: "client" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
function State() {
  const auth = useAuth();
  return <><p>{auth.ready ? auth.user?.username || "Visitante" : "Carregando"}</p><button onClick={() => void auth.logout().catch(() => undefined)}>Sair</button><button onClick={() => void api("/scheduling/bookings/").catch(() => undefined)}>Consultar</button></>;
}
afterEach(() => { vi.restoreAllMocks(); document.cookie = "barder_csrf=; Max-Age=0; path=/"; });
test("a failed logout keeps the session visible instead of falsely claiming logout", async () => {
  document.cookie = "barder_csrf=test; path=/";
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => String(url).endsWith("/auth/me/") ? json(user) : json({ detail: "Indisponível" }, 503));
  render(<AuthProvider><State /></AuthProvider>);
  await screen.findByText("cliente");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Sair" })); });
  expect(screen.queryByText("Visitante")).toBeNull();
  expect(screen.getByText("cliente")).toBeTruthy();
});

test("failed renewal clears stale authenticated UI so the person can log in again", async () => {
  document.cookie = "barder_csrf=test; path=/";
  vi.spyOn(globalThis, "fetch").mockImplementation(async url => String(url).endsWith("/auth/me/") ? json(user) : json({ detail: "Sessão encerrada" }, 401));
  render(<AuthProvider><State /></AuthProvider>);
  await screen.findByText("cliente");
  fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
  expect(await screen.findByText("Visitante")).toBeTruthy();
});
