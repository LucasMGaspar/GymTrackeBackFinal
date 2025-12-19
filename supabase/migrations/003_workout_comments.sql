-- Migration: Workout Comments System
-- Allows personal trainers to give feedback on student workouts

-- Create workout_comments table
CREATE TABLE IF NOT EXISTS workout_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_workout_comments_session ON workout_comments(session_id);
CREATE INDEX idx_workout_comments_author ON workout_comments(author_id);
CREATE INDEX idx_workout_comments_created ON workout_comments(created_at DESC);

-- Add comment_count to workout_sessions for quick access
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Function to update comment_count
CREATE OR REPLACE FUNCTION update_session_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workout_sessions 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE workout_sessions 
    SET comment_count = GREATEST(comment_count - 1, 0) 
    WHERE id = OLD.session_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain comment_count
DROP TRIGGER IF EXISTS trigger_update_comment_count ON workout_comments;
CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON workout_comments
FOR EACH ROW EXECUTE FUNCTION update_session_comment_count();

-- RLS Policies for workout_comments

-- Enable RLS
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;

-- Students can read comments on their own sessions
CREATE POLICY "Students can read comments on own sessions"
ON workout_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    WHERE ws.id = workout_comments.session_id
    AND ws.student_id = auth.uid()
  )
);

-- Students can create comments on their own sessions
CREATE POLICY "Students can comment on own sessions"
ON workout_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    WHERE ws.id = session_id
    AND ws.student_id = auth.uid()
  )
  AND author_id = auth.uid()
);

-- Personal trainers can read comments on their students' sessions
CREATE POLICY "Personal can read comments on students sessions"
ON workout_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    JOIN students s ON s.id = ws.student_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE ws.id = workout_comments.session_id
    AND s.personal_id = p.id
    AND p.role = 'personal'
  )
);

-- Personal trainers can create comments on their students' sessions
CREATE POLICY "Personal can comment on students sessions"
ON workout_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_sessions ws
    JOIN students s ON s.id = ws.student_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE ws.id = session_id
    AND s.personal_id = p.id
    AND p.role = 'personal'
  )
  AND author_id = auth.uid()
);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON workout_comments FOR DELETE
USING (author_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON workout_comments FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workout_comments_updated ON workout_comments;
CREATE TRIGGER trigger_workout_comments_updated
BEFORE UPDATE ON workout_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Backfill comment_count for existing sessions (set to 0)
UPDATE workout_sessions SET comment_count = 0 WHERE comment_count IS NULL;
