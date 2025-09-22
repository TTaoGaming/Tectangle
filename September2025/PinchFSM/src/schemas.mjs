import { z } from 'zod';

export const LandmarkZ = z.object({ x: z.number(), y: z.number(), z: z.number().nullable().optional() });
export const HandFrameZ = z.object({
  frameIndex: z.number().int().nonnegative(),
  timestampMs: z.number().int().nonnegative(),
  hands: z.array(z.object({
    handedness: z.array(z.object({ categoryName: z.string(), score: z.number() })),
    landmarks: z.array(LandmarkZ),
    worldLandmarks: z.array(LandmarkZ).optional(),
  }))
});

export const TraceArrayZ = z.array(HandFrameZ);
