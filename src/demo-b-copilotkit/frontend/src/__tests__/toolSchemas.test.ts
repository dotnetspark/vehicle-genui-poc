import { describe, it, expect } from "vitest";
import {
  ZFuelDatum,
  ZSeries,
  ZSeriesPoint,
  ZMakeDatum,
  ZShowFuelBreakdownArgs,
  ZShowTrendArgs,
  ZShowTopMakesArgs,
} from "../schemas/toolSchemas";

describe("ZFuelDatum", () => {
  it("accepts a valid fuel datum", () => {
    expect(ZFuelDatum.safeParse({ fuel: "Electric", count: 100, percentage: 20 }).success).toBe(true);
  });

  it("rejects empty fuel string", () => {
    expect(ZFuelDatum.safeParse({ fuel: "", count: 100, percentage: 20 }).success).toBe(false);
  });

  it("rejects negative count", () => {
    expect(ZFuelDatum.safeParse({ fuel: "BEV", count: -1, percentage: 10 }).success).toBe(false);
  });

  it("rejects percentage > 100", () => {
    expect(ZFuelDatum.safeParse({ fuel: "BEV", count: 10, percentage: 101 }).success).toBe(false);
  });

  it("rejects percentage < 0", () => {
    expect(ZFuelDatum.safeParse({ fuel: "BEV", count: 10, percentage: -0.1 }).success).toBe(false);
  });
});

describe("ZSeriesPoint", () => {
  it("accepts string x", () => {
    expect(ZSeriesPoint.safeParse({ x: "2024", y: 10 }).success).toBe(true);
  });

  it("accepts numeric x", () => {
    expect(ZSeriesPoint.safeParse({ x: 2024, y: 10 }).success).toBe(true);
  });

  it("rejects missing y", () => {
    expect(ZSeriesPoint.safeParse({ x: "2024" }).success).toBe(false);
  });
});

describe("ZSeries", () => {
  it("accepts a valid series with one point", () => {
    expect(
      ZSeries.safeParse({ name: "BEV", points: [{ x: "2024", y: 100 }] }).success
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      ZSeries.safeParse({ name: "", points: [{ x: "2024", y: 100 }] }).success
    ).toBe(false);
  });

  it("rejects empty points array", () => {
    expect(ZSeries.safeParse({ name: "BEV", points: [] }).success).toBe(false);
  });
});

describe("ZMakeDatum", () => {
  it("accepts valid make datum", () => {
    expect(ZMakeDatum.safeParse({ make: "FORD", count: 5000 }).success).toBe(true);
  });

  it("rejects empty make string", () => {
    expect(ZMakeDatum.safeParse({ make: "", count: 5000 }).success).toBe(false);
  });

  it("rejects negative count", () => {
    expect(ZMakeDatum.safeParse({ make: "FORD", count: -1 }).success).toBe(false);
  });
});

describe("ZShowFuelBreakdownArgs", () => {
  it("accepts a fully valid payload", () => {
    const payload = {
      panelId: "fuel-1",
      title: "Fuel breakdown",
      data: [{ fuel: "Electric", count: 50, percentage: 10 }],
    };
    expect(ZShowFuelBreakdownArgs.safeParse(payload).success).toBe(true);
  });

  it("rejects empty panelId", () => {
    const payload = { panelId: "", title: "T", data: [{ fuel: "BEV", count: 1, percentage: 1 }] };
    expect(ZShowFuelBreakdownArgs.safeParse(payload).success).toBe(false);
  });

  it("rejects empty data array", () => {
    const payload = { panelId: "p1", title: "T", data: [] };
    expect(ZShowFuelBreakdownArgs.safeParse(payload).success).toBe(false);
  });
});

describe("ZShowTrendArgs", () => {
  it("accepts up to 4 series", () => {
    const series = Array.from({ length: 4 }, (_, i) => ({
      name: `Series ${i}`,
      points: [{ x: "2024", y: i * 100 }],
    }));
    expect(ZShowTrendArgs.safeParse({ panelId: "t1", title: "T", series }).success).toBe(true);
  });

  it("rejects more than 4 series", () => {
    const series = Array.from({ length: 5 }, (_, i) => ({
      name: `S${i}`,
      points: [{ x: "2024", y: i }],
    }));
    expect(ZShowTrendArgs.safeParse({ panelId: "t1", title: "T", series }).success).toBe(false);
  });

  it("rejects empty series array", () => {
    expect(ZShowTrendArgs.safeParse({ panelId: "t1", title: "T", series: [] }).success).toBe(false);
  });
});

describe("ZShowTopMakesArgs", () => {
  it("accepts a valid payload", () => {
    const payload = {
      panelId: "m1",
      title: "Makes",
      data: [{ make: "FORD", count: 100 }, { make: "VAUXHALL", count: 80 }],
    };
    expect(ZShowTopMakesArgs.safeParse(payload).success).toBe(true);
  });

  it("rejects empty data array", () => {
    expect(ZShowTopMakesArgs.safeParse({ panelId: "m1", title: "T", data: [] }).success).toBe(false);
  });
});
