import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanels, setPanel, clearAll, type PanelDescriptor } from "../state/usePanels";

beforeEach(() => clearAll());
afterEach(() => clearAll());

describe("usePanels", () => {
  it("starts with an empty panel map", () => {
    const { result } = renderHook(() => usePanels());
    expect(Object.keys(result.current.panels)).toHaveLength(0);
  });

  it("setPanel adds a skeleton panel", () => {
    const { result } = renderHook(() => usePanels());
    act(() => setPanel("s1", { kind: "skeleton", title: "Loading…" }));
    expect(result.current.panels["s1"]).toMatchObject({ kind: "skeleton", title: "Loading…" });
  });

  it("setPanel adds a fuel panel", () => {
    const { result } = renderHook(() => usePanels());
    const data = [{ fuel: "petrol", count: 100, percentage: 50 }];
    act(() => setPanel("f1", { kind: "fuel", title: "Fuel", data }));
    const panel = result.current.panels["f1"] as PanelDescriptor & { kind: "fuel" };
    expect(panel.kind).toBe("fuel");
    expect(panel.data).toEqual(data);
  });

  it("setPanel adds a trend panel", () => {
    const { result } = renderHook(() => usePanels());
    const series = [{ name: "BEV", points: [{ x: "2024", y: 100 }] }];
    act(() => setPanel("t1", { kind: "trend", title: "Trend", series }));
    const panel = result.current.panels["t1"] as PanelDescriptor & { kind: "trend" };
    expect(panel.kind).toBe("trend");
    expect(panel.series).toEqual(series);
  });

  it("setPanel adds a makes panel", () => {
    const { result } = renderHook(() => usePanels());
    const data = [{ make: "FORD", count: 5000 }];
    act(() => setPanel("m1", { kind: "makes", title: "Makes", data }));
    const panel = result.current.panels["m1"] as PanelDescriptor & { kind: "makes" };
    expect(panel.kind).toBe("makes");
    expect(panel.data).toEqual(data);
  });

  it("setPanel adds an error panel", () => {
    const { result } = renderHook(() => usePanels());
    act(() =>
      setPanel("e1", { kind: "error", title: "Error", message: "Validation failed", rawArgs: { x: 1 } })
    );
    const panel = result.current.panels["e1"] as PanelDescriptor & { kind: "error" };
    expect(panel.kind).toBe("error");
    expect(panel.message).toBe("Validation failed");
    expect(panel.rawArgs).toEqual({ x: 1 });
  });

  it("setPanel with the same id replaces the existing panel", () => {
    const { result } = renderHook(() => usePanels());
    act(() => setPanel("p1", { kind: "skeleton", title: "Loading…" }));
    act(() =>
      setPanel("p1", { kind: "fuel", title: "Fuel updated", data: [{ fuel: "BEV", count: 10, percentage: 5 }] })
    );
    expect(result.current.panels["p1"].kind).toBe("fuel");
    expect(result.current.panels["p1"].title).toBe("Fuel updated");
  });

  it("setPanel does not affect panels with other ids", () => {
    const { result } = renderHook(() => usePanels());
    act(() => setPanel("a", { kind: "skeleton", title: "A" }));
    act(() => setPanel("b", { kind: "skeleton", title: "B" }));
    expect(result.current.panels["a"]).toBeDefined();
    expect(result.current.panels["b"]).toBeDefined();
  });

  it("clearAll removes all panels", () => {
    const { result } = renderHook(() => usePanels());
    act(() => setPanel("p1", { kind: "skeleton", title: "X" }));
    act(() => setPanel("p2", { kind: "skeleton", title: "Y" }));
    act(() => clearAll());
    expect(Object.keys(result.current.panels)).toHaveLength(0);
  });

  it("multiple subscribers all receive the same state update", () => {
    const { result: r1 } = renderHook(() => usePanels());
    const { result: r2 } = renderHook(() => usePanels());
    act(() => setPanel("p1", { kind: "skeleton", title: "Shared" }));
    expect(r1.current.panels["p1"]).toBeDefined();
    expect(r2.current.panels["p1"]).toBeDefined();
  });
});
