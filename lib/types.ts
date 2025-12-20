// Database types
export type UserRole = 'personal' | 'student';
export type StudentStatus = 'invited' | 'active' | 'inactive';
export type WorkoutSessionStatus = 'in_progress' | 'completed';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  created_at: string;
}

export interface Student {
  id: string;
  personal_id: string;
  student_user_id: string | null;
  student_name: string;
  student_email: string;
  status: StudentStatus;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
  total_workouts_completed: number;
  created_at: string;
}

export interface Exercise {
  id: string;
  personal_id: string;
  name: string;
  muscle_group: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  student_id: string;
  weekday: number; // 0-6
  name: string;
  notes: string | null;
  created_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: string;
  notes: string | null;
  exercise?: Exercise; // Joined data
}

export interface WorkoutSession {
  id: string;
  student_user_id: string;
  student_id: string | null;
  template_id: string | null;
  template_name: string | null;
  session_date: string;
  status: WorkoutSessionStatus;
  notes: string | null;
  duration_minutes: number | null;
  completed_at: string | null;
  comment_count: number;
  created_at: string;
  template?: WorkoutTemplate; // Joined data
}

export interface WorkoutSessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number | null;
  target_reps: string | null;
  actual_sets: number;
  actual_reps: string;
  actual_load: number | null;
  notes: string | null;
  exercise?: Exercise; // Joined data
}

export interface WorkoutComment {
  id: string;
  session_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile; // Joined data
}

export type GoalType =
  | 'weight_loss'
  | 'weight_gain'
  | 'muscle_gain'
  | 'fat_loss'
  | 'circumference_reduction'
  | 'circumference_increase'
  | 'load_increase'
  | 'workout_frequency';

export type GoalStatus = 'active' | 'completed' | 'cancelled' | 'paused';

export type CircumferenceType = 'chest' | 'waist' | 'hip' | 'arm' | 'thigh' | 'calf';

export interface Goal {
  id: string;
  student_id: string;
  personal_id: string;
  title: string;
  description: string | null;
  goal_type: GoalType;
  target_value: number;
  initial_value: number | null;
  current_value: number | null;
  exercise_id: string | null;
  exercise_name: string | null;
  circumference_type: CircumferenceType | null;
  start_date: string;
  target_date: string;
  completed_at: string | null;
  status: GoalStatus;
  progress_percentage: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  exercise?: Exercise; // Joined data
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'streak' | 'total_workouts' | 'pr' | 'custom';
  requirement_value: number;
  created_at: string;
}

export interface StudentAchievement {
  id: string;
  student_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement; // Joined data
}
