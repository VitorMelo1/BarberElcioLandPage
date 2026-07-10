import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useMediaQuery } from "./useMediaQuery";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useSmoothScroll } from "./useSmoothScroll";

function MediaProbe() {
  const mobile = useMediaQuery("(max-width: 640px)");
  const reduced = usePrefersReducedMotion();
  useSmoothScroll();
  return (
    <div>
      <span>{mobile ? "mobile" : "desktop"}</span>
      <span>{reduced ? "reduced" : "motion"}</span>
    </div>
  );
}

describe("hooks", () => {
  test("returns media query state and mounts smooth scroll", () => {
    render(<MediaProbe />);

    expect(screen.getByText("desktop")).toBeTruthy();
    expect(screen.getByText("motion")).toBeTruthy();
  });
});
