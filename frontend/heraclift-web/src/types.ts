export interface RoutineExercise {
  id: number;
  name: string;
  targetSets: number;
  targetReps: number;
  order: number;
  notes: string;
}

export interface RoutineWorkout {
  id: number;
  name: string;
  order: number;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  currentWorkoutIndex: number;
  workouts: RoutineWorkout[];
}

export interface SetLog {
  id: number;
  exerciseName: string;
  setNumber: number;
  weight: number;
  unit: string;
  reps: number;
}

export interface WorkoutSession {
  id: number;
  routineId: number | null;
  routineWorkoutId: number | null;
  workoutName: string;
  startedAt: string;
  completedAt: string | null;
  sets: SetLog[];
}
