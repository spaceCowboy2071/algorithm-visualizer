-- Per-user whiteboards: one row per user, lazy-loaded when WhiteBoard page opens.
-- Standalone canvas (not tied to a Blind 75 problem), one per user for v1.
CREATE TABLE IF NOT EXISTS whiteboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stroke_data JSONB NOT NULL DEFAULT '{"strokes":[],"canvasWidth":0,"canvasHeight":0}',
  updated_at TIMESTAMP DEFAULT NOW()
);
