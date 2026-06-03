import { useSyncExternalStore } from "react";
import type { FuelDatum } from "../components/FuelBreakdownChart";
import type { Series } from "../components/TrendChart";
import type { MakeDatum } from "../components/TopMakesTable";

export type PanelDescriptor =
  | { kind: "fuel"; title: string; data: FuelDatum[] }
  | { kind: "trend"; title: string; series: Series[] }
  | { kind: "makes"; title: string; data: MakeDatum[] }
  | { kind: "skeleton"; title: string }
  | { kind: "error"; title: string; message: string; rawArgs?: unknown };

type PanelMap = Record<string, PanelDescriptor>;

let panels: PanelMap = {};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setPanel(id: string, desc: PanelDescriptor): void {
  panels = { ...panels, [id]: desc };
  emit();
}

export function clearAll(): void {
  panels = {};
  emit();
}

export function usePanels() {
  const snap = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => panels,
    () => panels,
  );
  return { panels: snap, setPanel, clearAll };
}
