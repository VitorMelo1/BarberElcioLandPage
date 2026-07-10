import { afterEach, describe, expect, test, vi } from "vitest";

import { createBooking, getSlots } from "./schedulingService";

function mockJson(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

describe("scheduling service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("requests slots with selected service ids", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJson({ date: "2026-07-01", duration_min: 60, slots: [] }),
    );

    await getSlots("2026-07-01", [1, 2]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/scheduling/slots/?date=2026-07-01&services=1,2",
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("creates bookings with cookie auth and selected services", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockJson({ id: 1, start: "2026-07-01T12:00:00-03:00" }, 201));

    await createBooking([1, 2], "2026-07-01T12:00:00-03:00");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/scheduling/bookings/create/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        credentials: "include",
        body: JSON.stringify({
          service_ids: [1, 2],
          start: "2026-07-01T12:00:00-03:00",
        }),
      }),
    );
  });
});
