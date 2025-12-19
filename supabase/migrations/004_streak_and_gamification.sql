-- Migration: Streak and Gamification System
-- Adds streak tracking and achievement badges

-- Add streak fields to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_workout_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS total_workouts_completed INTEGER DEFAULT 0;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('streak', 'total_workouts', 'pr', 'custom')),
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_achievements table (many-to-many)
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, achievement_id)
);

-- Create indexes
CREATE INDEX idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX idx_student_achievements_achievement ON student_achievements(achievement_id);

-- RLS for achievements (public read)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
ON achievements FOR SELECT
TO PUBLIC
USING (true);

-- RLS for student_achievements
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

-- Students can read their own achievements
CREATE POLICY "Students can read own achievements"
ON student_achievements FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Personal trainers can read their students' achievements
CREATE POLICY "Personal can read students achievements"
ON student_achievements FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE personal_id = auth.uid()
  )
);

-- Function to update streak
CREATE OR REPLACE FUNCTION update_student_streak()
RETURNS TRIGGER AS $$
DECLARE
  student_record RECORD;
  last_date DATE;
  days_diff INTEGER;
BEGIN
  -- Get student record
  SELECT * INTO student_record FROM students WHERE id = NEW.student_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  last_date := student_record.last_workout_date;
  
  -- Calculate streak
  IF last_date IS NULL THEN
    -- First workout
    UPDATE students 
    SET 
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      last_workout_date = NEW.session_date::DATE,
      total_workouts_completed = total_workouts_completed + 1
    WHERE id = NEW.student_id;
  ELSE
    days_diff := NEW.session_date::DATE - last_date;
    
    IF days_diff = 0 THEN
      -- Same day, just increment total
      UPDATE students 
      SET total_workouts_completed = total_workouts_completed + 1
      WHERE id = NEW.student_id;
    ELSIF days_diff = 1 THEN
      -- Consecutive day, increment streak
      UPDATE students 
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_workout_date = NEW.session_date::DATE,
        total_workouts_completed = total_workouts_completed + 1
      WHERE id = NEW.student_id;
    ELSE
      -- Streak broken, reset to 1
      UPDATE students 
      SET 
        current_streak = 1,
        longest_streak = GREATEST(longest_streak, 1),
        last_workout_date = NEW.session_date::DATE,
        total_workouts_completed = total_workouts_completed + 1
      WHERE id = NEW.student_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak when workout is completed
DROP TRIGGER IF EXISTS trigger_update_streak ON workout_sessions;
CREATE TRIGGER trigger_update_streak
AFTER UPDATE OF status ON workout_sessions
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_student_streak();

-- Insert default achievements
INSERT INTO achievements (key, name, description, icon, requirement_type, requirement_value) VALUES
  ('first_workout', 'Primeira Vitória', 'Complete seu primeiro treino', '🎯', 'total_workouts', 1),
  ('streak_3', 'Consistente', '3 dias seguidos treinando', '🔥', 'streak', 3),
  ('streak_7', 'Warrior', '7 dias seguidos treinando', '💪', 'streak', 7),
  ('streak_14', 'Máquina', '14 dias seguidos treinando', '⚡', 'streak', 14),
  ('streak_30', 'Lendário', '30 dias seguidos treinando', '👑', 'streak', 30),
  ('total_10', 'Iniciante Dedicado', '10 treinos completados', '🌟', 'total_workouts', 10),
  ('total_25', 'Em Evolução', '25 treinos completados', '📈', 'total_workouts', 25),
  ('total_50', 'Meio Século', '50 treinos completados', '🏆', 'total_workouts', 50),
  ('total_100', 'Centurião', '100 treinos completados', '💯', 'total_workouts', 100),
  ('total_250', 'Elite', '250 treinos completados', '👊', 'total_workouts', 250)
ON CONFLICT (key) DO NOTHING;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements()
RETURNS TRIGGER AS $$
DECLARE
  student_record RECORD;
  achievement_record RECORD;
BEGIN
  -- Get updated student data
  SELECT * INTO student_record FROM students WHERE id = NEW.student_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Check streak achievements
  FOR achievement_record IN 
    SELECT * FROM achievements 
    WHERE requirement_type = 'streak' 
    AND requirement_value <= student_record.current_streak
  LOOP
    -- Insert if not already earned
    INSERT INTO student_achievements (student_id, achievement_id)
    VALUES (student_record.id, achievement_record.id)
    ON CONFLICT (student_id, achievement_id) DO NOTHING;
  END LOOP;

  -- Check total workouts achievements
  FOR achievement_record IN 
    SELECT * FROM achievements 
    WHERE requirement_type = 'total_workouts' 
    AND requirement_value <= student_record.total_workouts_completed
  LOOP
    -- Insert if not already earned
    INSERT INTO student_achievements (student_id, achievement_id)
    VALUES (student_record.id, achievement_record.id)
    ON CONFLICT (student_id, achievement_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check achievements after streak update
DROP TRIGGER IF EXISTS trigger_check_achievements ON students;
CREATE TRIGGER trigger_check_achievements
AFTER UPDATE OF current_streak, total_workouts_completed ON students
FOR EACH ROW
EXECUTE FUNCTION check_and_award_achievements();

-- Backfill existing student data (run once)
DO $$
DECLARE
  student_rec RECORD;
  completed_sessions RECORD;
  prev_date DATE;
  current_streak_calc INTEGER;
  longest_streak_calc INTEGER;
  temp_streak INTEGER;
BEGIN
  FOR student_rec IN SELECT id FROM students LOOP
    current_streak_calc := 0;
    longest_streak_calc := 0;
    temp_streak := 0;
    prev_date := NULL;

    -- Get all completed sessions for this student, ordered by date
    FOR completed_sessions IN 
      SELECT DISTINCT session_date::DATE as workout_date
      FROM workout_sessions
      WHERE student_id = student_rec.id AND status = 'completed'
      ORDER BY workout_date ASC
    LOOP
      IF prev_date IS NULL THEN
        temp_streak := 1;
      ELSIF completed_sessions.workout_date - prev_date = 1 THEN
        temp_streak := temp_streak + 1;
      ELSE
        longest_streak_calc := GREATEST(longest_streak_calc, temp_streak);
        temp_streak := 1;
      END IF;
      
      prev_date := completed_sessions.workout_date;
    END LOOP;

    longest_streak_calc := GREATEST(longest_streak_calc, temp_streak);
    
    -- Check if current streak is still active (within last 2 days)
    IF prev_date IS NOT NULL AND (CURRENT_DATE - prev_date) <= 1 THEN
      current_streak_calc := temp_streak;
    ELSE
      current_streak_calc := 0;
    END IF;

    -- Update student record
    UPDATE students 
    SET 
      current_streak = current_streak_calc,
      longest_streak = longest_streak_calc,
      last_workout_date = prev_date,
      total_workouts_completed = (
        SELECT COUNT(DISTINCT session_date::DATE) 
        FROM workout_sessions 
        WHERE student_id = student_rec.id AND status = 'completed'
      )
    WHERE id = student_rec.id;
  END LOOP;
END $$;
