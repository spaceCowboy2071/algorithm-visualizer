-- Per-problem sketches: one row per (user, problem) pair, lazy-loaded when Sketch Zone opens
CREATE TABLE IF NOT EXISTS sketches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL,
  stroke_data JSONB NOT NULL DEFAULT '{"strokes":[],"canvasWidth":0,"canvasHeight":0}',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, problem_id)
);
