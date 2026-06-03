import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressPanel } from "../components/ProgressPanel";

describe("ProgressPanel", () => {
  it("shows 'Pending…' badge for unknown/default status", () => {
    render(<ProgressPanel status="pending" />);
    expect(screen.getByText("Pending…")).toBeInTheDocument();
  });

  it("shows 'Streaming…' badge when status is 'inProgress'", () => {
    render(<ProgressPanel status="inProgress" />);
    expect(screen.getByText("Streaming…")).toBeInTheDocument();
  });

  it("shows item count in badge when streaming with items", () => {
    render(<ProgressPanel status="inProgress" itemCount={42} />);
    expect(screen.getByText("Streaming… (42)")).toBeInTheDocument();
  });

  it("shows 'Processing…' badge when status is 'executing'", () => {
    render(<ProgressPanel status="executing" />);
    expect(screen.getByText("Processing…")).toBeInTheDocument();
  });

  it("renders ChartSkeleton when no partialContent provided", () => {
    render(<ProgressPanel status="pending" />);
    // ChartSkeleton renders with role="status" and aria-label="Loading chart"
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();
  });

  it("renders partialContent instead of skeleton when provided", () => {
    render(
      <ProgressPanel
        status="inProgress"
        partialContent={<div data-testid="partial">partial chart</div>}
      />
    );
    expect(screen.getByTestId("partial")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading chart")).not.toBeInTheDocument();
  });
});
