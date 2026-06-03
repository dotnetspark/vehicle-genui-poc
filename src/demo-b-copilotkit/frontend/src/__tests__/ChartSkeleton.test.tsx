import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartSkeleton } from "../components/ChartSkeleton";

describe("ChartSkeleton", () => {
  it("renders with role='status'", () => {
    render(<ChartSkeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has accessible aria-label 'Loading chart'", () => {
    render(<ChartSkeleton />);
    expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();
  });

  it("contains animated placeholder bars", () => {
    const { container } = render(<ChartSkeleton />);
    const bars = container.querySelectorAll(".animate-pulse");
    // Skeleton has multiple bars — at least 3 expected
    expect(bars.length).toBeGreaterThanOrEqual(3);
  });
});
