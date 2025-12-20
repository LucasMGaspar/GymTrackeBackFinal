// Database types
export type UserRole = 'personal' | 'student';
export type StudentStatus = 'invited' | 'active' | 'inactive';
export type WorkoutSessionStatus = 'in_progress' | 'done';

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
  template_id: string | null;
  session_date: string;
  status: WorkoutSessionStatus;
  completed_at: string | null;
  created_at: string;
  template?: WorkoutTemplate; // Joined data
}

export interface WorkoutSessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
  sets_done: number;
  reps_done: string;
  load: number | null;
  notes: string | null;
  exercise?: Exercise; // Joined data
}
