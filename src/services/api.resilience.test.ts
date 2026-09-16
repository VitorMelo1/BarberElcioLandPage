import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "./api";

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("API failure recovery", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); document.cookie = "barder_csrf=; Max-Age=0; path=/"; });

  test("preserves field validation details and HTTP status for forms", async () => {
    document.cookie = "barder_csrf=test-token; path=/";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response({ price: ["Informe um valor positivo."] }, 400));
    await expect(api("/catalog/admin/services/", { method: "POST", body: { price: -1 } })).rejects.toMatchObject({
      status: 400, message: "price: Informe um valor positivo.", fields: { price: ["Informe um valor positivo."] },
    });
  });

  test("bootstraps CSRF before unauthenticated login and includes it in mutation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input).endsWith("/auth/csrf/")) return response({ csrfToken: "masked-test-token" });
      if ((init?.headers as Record<string, string>)["X-Barder-CSRF"] !== "masked-test-token") return response({ detail: "CSRF missing" }, 403);
      return response({ user: { id: 7 } });
    });
    expect(await api("/auth/login/", { method: "POST", body: {} })).toEqual({ user: { id: 7 } });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/csrf/");
  });

  test("does not turn deliberate request cancellation into a connection error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("Aborted", "AbortError"));
    await expect(api("/scheduling/slots/")).rejects.toMatchObject({ name: "AbortError" });
  });

  test("reports a server error without rendering a proxy HTML page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<html>nginx</html>", { status: 502 }));
    await expect(api("/catalog/services/")).rejects.toMatchObject({ status: 502, message: expect.stringContaining("servidor") });
  });
});
