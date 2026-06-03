import { z } from "zod";

// --------------------------------------------------------------------------
// Primitive data shapes (mirror the TypeScript interfaces in chart components)
// --------------------------------------------------------------------------

export const ZFuelDatum = z.object({
  fuel: z.string().min(1),
  count: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export const ZSeriesPoint = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number(),
});

export const ZSeries = z.object({
  name: z.string().min(1),
  points: z.array(ZSeriesPoint).min(1),
});

export const ZMakeDatum = z.object({
  make: z.string().min(1),
  count: z.number().nonnegative(),
});

// --------------------------------------------------------------------------
// Full tool argument schemas
// --------------------------------------------------------------------------

export const ZShowFuelBreakdownArgs = z.object({
  panelId: z.string().min(1),
  title: z.string().min(1),
  data: z.array(ZFuelDatum).min(1),
});

export const ZShowTrendArgs = z.object({
  panelId: z.string().min(1),
  title: z.string().min(1),
  series: z.array(ZSeries).min(1).max(4),
});

export const ZShowTopMakesArgs = z.object({
  panelId: z.string().min(1),
  title: z.string().min(1),
  data: z.array(ZMakeDatum).min(1),
});

// --------------------------------------------------------------------------
// Inferred types — used by handler functions so we keep a single source of truth
// --------------------------------------------------------------------------

export type ShowFuelBreakdownArgs = z.infer<typeof ZShowFuelBreakdownArgs>;
export type ShowTrendArgs = z.infer<typeof ZShowTrendArgs>;
export type ShowTopMakesArgs = z.infer<typeof ZShowTopMakesArgs>;
