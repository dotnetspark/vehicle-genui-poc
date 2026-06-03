import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelErrorBoundary } from "../components/PanelErrorBoundary";

// Component that unconditionally throws during render — used to trigger boundaries.
function AlwaysThrows({ message }: { message: string }) {
  throw new Error(message);
}

describe("PanelErrorBoundary", () => {
  it("renders children when no error is thrown", () => {
    render(
      <PanelErrorBoundary>
        <div data-testid="safe">all good</div>
      </PanelErrorBoundary>
    );
    expect(screen.getByTestId("safe")).toBeInTheDocument();
  });

  it("renders fallback header when a child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PanelErrorBoundary panelLabel="Fuel Breakdown">
        <AlwaysThrows message="render boom" />
      </PanelErrorBoundary>
    );
    expect(screen.getByText("Fuel Breakdown failed to render")).toBeInTheDocument();
    expect(screen.getByText("render boom")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("uses default 'Panel' label when panelLabel is omitted", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PanelErrorBoundary>
        <AlwaysThrows message="crash" />
      </PanelErrorBoundary>
    );
    expect(screen.getByText("Panel failed to render")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("shows Retry button in error state", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PanelErrorBoundary>
        <AlwaysThrows message="crash" />
      </PanelErrorBoundary>
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("shows 'View raw data' button when rawArgs is provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PanelErrorBoundary rawArgs={{ fuel: "petrol", count: 1 }}>
        <AlwaysThrows message="crash" />
      </PanelErrorBoundary>
    );
    expect(screen.getByRole("button", { name: "View raw data" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("does NOT show 'View raw data' button when rawArgs is undefined", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PanelErrorBoundary>
        <AlwaysThrows message="crash" />
      </PanelErrorBoundary>
    );
    expect(screen.queryByRole("button", { name: "View raw data" })).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it("toggles raw JSON pane when 'View raw data' is clicked", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rawArgs = { fuel: "electric", count: 42 };
    render(
      <PanelErrorBoundary rawArgs={rawArgs}>
        <AlwaysThrows message="crash" />
      </PanelErrorBoundary>
    );
    const viewBtn = screen.getByRole("button", { name: "View raw data" });
    fireEvent.click(viewBtn);
    // Pre element with JSON should now be visible
    expect(screen.getByText(/"fuel"/)).toBeInTheDocument();
    // Button text toggles to "Hide raw data"
    expect(screen.getByRole("button", { name: "Hide raw data" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("re-renders children after Retry is clicked", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Use a mutable flag so the child stops throwing once Retry is clicked.
    let shouldThrow = true;
    const ControlledChild = () => {
      if (shouldThrow) throw new Error("controlled crash");
      return <div data-testid="recovered">recovered</div>;
    };

    render(
      <PanelErrorBoundary>
        <ControlledChild />
      </PanelErrorBoundary>
    );
    expect(screen.getByText("Panel failed to render")).toBeInTheDocument();

    // Flip the flag BEFORE clicking Retry so the child renders cleanly on reset.
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.queryByText("Panel failed to render")).not.toBeInTheDocument();
    expect(screen.getByTestId("recovered")).toBeInTheDocument();
    spy.mockRestore();
  });
});
