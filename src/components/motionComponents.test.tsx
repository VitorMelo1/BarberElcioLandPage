import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AnimatedTitle } from "./AnimatedTitle/AnimatedTitle";
import { Reveal } from "./Reveal/Reveal";

describe("motion components", () => {
  test("renders animated title words and reveal content", () => {
    render(
      <Reveal>
        <AnimatedTitle title={"Corte <b>premium</b><br/>na agenda"} align="left" />
      </Reveal>,
    );

    expect(screen.getByText("Corte")).toBeTruthy();
    expect(screen.getByText("premium")).toBeTruthy();
    expect(screen.getByText("agenda")).toBeTruthy();
  });
});
