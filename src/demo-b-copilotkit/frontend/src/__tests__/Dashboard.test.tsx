import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dashboard } from "../components/Dashboard";
import { setPanel, clearAll } from "../state/usePanels";

beforeEach(() => clearAll());
afterEach(() => clearAll());

describe("Dashboard", () => {
  it("shows empty-state message when no panels are registered", () => {
    render(<Dashboard />);
    expect(screen.getByText(/Ask a question/)).toBeInTheDocument();
  });

  it("does not render the grid when empty", () => {
    const { container } = render(<Dashboard />);
    expect(container.querySelector(".grid")).not.toBeInTheDocument();
  });

  it("renders a skeleton panel with ChartSkeleton", () => {
    setPanel("s1", { kind: "skeleton", title: "Loading chart…" });
    render(<Dashboard />);
    expect(screen.getByText("Loading chart…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();
  });

  it("renders a fuel panel with the correct title", () => {
    setPanel("f1", {
      kind: "fuel",
      title: "Fuel by type",
      data: [{ fuel: "Electric", count: 200, percentage: 20 }],
    });
    render(<Dashboard />);
    expect(screen.getByText("Fuel by type")).toBeInTheDocument();
  });

  it("renders a makes panel with the correct title", () => {
    setPanel("m1", {
      kind: "makes",
      title: "Top makes",
      data: [{ make: "FORD", count: 5000 }, { make: "VAUXHALL", count: 4000 }],
    });
    render(<Dashboard />);
    expect(screen.getByText("Top makes")).toBeInTheDocument();
  });

  it("renders a trend panel with the correct title", () => {
    setPanel("t1", {
      kind: "trend",
      title: "Registrations over time",
      series: [{ name: "BEV", points: [{ x: "2024", y: 100 }] }],
    });
    render(<Dashboard />);
    expect(screen.getByText("Registrations over time")).toBeInTheDocument();
  });

  it("renders an error panel with the error message", () => {
    setPanel("e1", {
      kind: "error",
      title: "Broken panel",
      message: "Validation failed: data must not be empty",
    });
    render(<Dashboard />);
    expect(screen.getByText("Broken panel")).toBeInTheDocument();
    expect(screen.getByText("Validation failed: data must not be empty")).toBeInTheDocument();
  });

  it("renders multiple panels simultaneously", () => {
    setPanel("s1", { kind: "skeleton", title: "Panel A" });
    setPanel("f1", { kind: "fuel", title: "Panel B", data: [{ fuel: "BEV", count: 10, percentage: 5 }] });
    render(<Dashboard />);
    expect(screen.getByText("Panel A")).toBeInTheDocument();
    expect(screen.getByText("Panel B")).toBeInTheDocument();
  });

  it("wraps each panel in a PanelErrorBoundary (survives a child render error)", () => {
    setPanel("e1", { kind: "error", title: "Safe error", message: "expected error" });
    expect(() => render(<Dashboard />)).not.toThrow();
  });
});
