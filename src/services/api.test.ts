import { afterEach, describe, expect, test, vi } from "vitest";

import { api } from "./api";

function mockJson(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

describe("api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("sends cookies on every request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson({ ok: true }));

    await api("/auth/me/");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/auth/me/",
      expect.objectContaining({
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "GET",
      }),
    );
  });

  test("does not read or write JWTs in localStorage", async () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem");
    const setSpy = vi.spyOn(Storage.prototype, "setItem");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson({ ok: true }));

    await api("/auth/me/");

    expect(getSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });

  test("renews the session once on 401 and retries the request", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockJson({ detail: "expirado" }, 401))
      .mockResolvedValueOnce(mockJson({ detail: "ok" }))
      .mockResolvedValueOnce(mockJson({ id: 1 }));

    const result = await api<{ id: number }>("/auth/me/");

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:8000/api/auth/refresh/");
  });

  test("does not renew the session when login fails", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockJson({ detail: "Credenciais inválidas." }, 401));

    await expect(api("/auth/login/", { method: "POST", body: { username: "x" } })).rejects.toThrow(
      "Credenciais inválidas.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("gives up after a failed renewal", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockJson({ detail: "expirado" }, 401))
      .mockResolvedValueOnce(mockJson({ detail: "refresh morto" }, 401));

    await expect(api("/auth/me/")).rejects.toThrow("expirado");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("keeps multipart requests free of JSON content type", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJson({ ok: true }));
    const form = new FormData();
    form.append("image", new File(["img"], "look.jpg", { type: "image/jpeg" }));

    await api("/catalog/admin/portfolio/", { method: "POST", body: form });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/catalog/admin/portfolio/",
      expect.objectContaining({ body: form, headers: {} }),
    );
  });
});
