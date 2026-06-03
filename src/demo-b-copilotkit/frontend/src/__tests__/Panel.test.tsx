import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Panel } from "../components/Panel";

describe("Panel", () => {
  it("renders the title", () => {
    render(<Panel title="My Panel"><div>content</div></Panel>);
    expect(screen.getByText("My Panel")).toBeInTheDocument();
  });

  it("renders caption when provided", () => {
    render(<Panel title="T" caption="Subtitle text"><div /></Panel>);
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  it("does not render a caption element when caption is omitted", () => {
    render(<Panel title="T"><div data-testid="child" /></Panel>);
    expect(screen.queryByText("Subtitle text")).not.toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders children inside the panel", () => {
    render(
      <Panel title="T">
        <span data-testid="inner">hello</span>
      </Panel>
    );
    expect(screen.getByTestId("inner")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("applies extra className to the section element", () => {
    const { container } = render(<Panel title="T" className="custom-cls"><div /></Panel>);
    expect(container.querySelector("section.custom-cls")).toBeInTheDocument();
  });
});
