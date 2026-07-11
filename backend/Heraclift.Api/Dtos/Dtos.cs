namespace Heraclift.Api.Dtos;

// Auth
public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Username, string Password);
public record AuthResponse(string Token, string Username);

// Routines
public record ExerciseDto(int Id, string Name, int TargetSets, int TargetReps, int Order, string Notes);
public record WorkoutDto(int Id, string Name, int Order, List<ExerciseDto> Exercises);
public record RoutineDto(int Id, string Name, string Description, bool IsActive, int CurrentWorkoutIndex, List<WorkoutDto> Workouts);

public record SaveExercise(string Name, int TargetSets, int TargetReps, string? Notes);
public record SaveWorkout(string Name, List<SaveExercise> Exercises);
public record SaveRoutine(string Name, string? Description, List<SaveWorkout> Workouts);

// Sessions
public record StartSessionRequest(int? RoutineId, int? RoutineWorkoutId, string WorkoutName);
public record LogSetRequest(string ExerciseName, int SetNumber, double Weight, string Unit, int Reps);
public record SetLogDto(int Id, string ExerciseName, int SetNumber, double Weight, string Unit, int Reps);
public record SessionDto(int Id, int? RoutineId, int? RoutineWorkoutId, string WorkoutName, DateTime StartedAt, DateTime? CompletedAt, List<SetLogDto> Sets);

// Nutrition
public record NutritionEntryRequest(string Date, string Name, double Calories, double Protein, double Carbs, double Fat);
public record NutritionGoalRequest(double Calories, double Protein, double Carbs, double Fat);

// Runs
public record RunRequest(string RaceType, double? DistanceKm, int DurationSeconds, string Date, string? Notes);
public record RunDto(int Id, string RaceType, double DistanceKm, int DurationSeconds, string Date, string Notes);

// Exercise weights
public record ExerciseWeightDto(string ExerciseName, double Weight, string Unit);

// Calculators
public record OneRepMaxRequest(double Weight, int Reps);
public record OneRepMaxResponse(double Epley, double Brzycki, double Lombardi, double Average, Dictionary<int, double> PercentageTable);

public record TdeeRequest(string Sex, double WeightKg, double HeightCm, int Age, string ActivityLevel, string Goal);
public record TdeeResponse(double Bmr, double Tdee, double TargetCalories, double Protein, double Carbs, double Fat);

public record BmiRequest(double WeightKg, double HeightCm);
public record BmiResponse(double Bmi, string Category);