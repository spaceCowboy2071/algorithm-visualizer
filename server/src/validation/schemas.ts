import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
  displayName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export const progressUpdateSchema = z.object({
  status: z.enum(['not_started', 'studied', 'in_progress', 'review', 'solved']).optional(),
  solvedIndependently: z.boolean().optional(),
  solvedIn20Min: z.boolean().optional(),
  confidence: z.number().int().min(0).max(5).optional(),
  attemptCount: z.number().int().min(0).optional(),
  timeComplexity: z.string().max(20).optional(),
  spaceComplexity: z.string().max(20).optional(),
  notes: z.string().optional(),
  savedCodeJs: z.string().optional(),
  savedCodePython: z.string().optional(),
});

// Envelope-only validation: trust frontend on individual stroke shape, but enforce
// top-level structure and cap array length to defend against bloat payloads.
// `name` is optional — frontend allows users to rename their sketch.
export const sketchUpdateSchema = z.object({
  name: z.string().max(100).optional(),
  strokes: z.array(z.unknown()).max(2000, 'Too many strokes (max 2000)'),
  canvasWidth: z.number().int().min(0).max(10000),
  canvasHeight: z.number().int().min(0).max(10000),
});

// Whiteboards use the same envelope shape as sketches: { name?, strokes,
// canvasWidth, canvasHeight }. Defined as a separate schema (not reusing
// sketchUpdateSchema) so the two features can evolve independently — adding
// a whiteboard-specific field later wouldn't risk breaking sketches.
export const whiteboardUpdateSchema = z.object({
  name: z.string().max(100).optional(),
  strokes: z.array(z.unknown()).max(2000, 'Too many strokes (max 2000)'),
  canvasWidth: z.number().int().min(0).max(10000),
  canvasHeight: z.number().int().min(0).max(10000),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>;
export type SketchUpdateInput = z.infer<typeof sketchUpdateSchema>;
export type WhiteboardUpdateInput = z.infer<typeof whiteboardUpdateSchema>;
