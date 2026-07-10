namespace Heraclift.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string PasswordSalt { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public NutritionGoal? NutritionGoal { get; set; }
    public List<Routine> Routines { get; set; } = new();
}

/// <summary>Routine with workouts, e.g. PPL.</summary>
public class Routine
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public bool IsActive { get; set; }
    /// <summary>Index of the next workout the user is "on".</summary>
    public int CurrentWorkoutIndex { get; set; }
    public List<RoutineWorkout> Workouts { get; set; } = new();
}

/// <summary>One workout within a routine, e.g. "Day 1 — Push".</summary>
public class RoutineWorkout
{
    public int Id { get; set; }
    public int RoutineId { get; set; }
    public string Name { get; set; } = "";
    public int Order { get; set; }
    public List<RoutineExercise> Exercises { get; set; } = new();
}

public class RoutineExercise
{
    public int Id { get; set; }
    public int RoutineWorkoutId { get; set; }
    public string Name { get; set; } = "";
    public int TargetSets { get; set; } = 2;
    public int TargetReps { get; set; } = 8;
    public int Order { get; set; }
    public string Notes { get; set; } = "";
}

/// <summary>A performed workout. SetLogs record actual weight/reps per set.</summary>
public class WorkoutSession
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? RoutineId { get; set; }
    public int? RoutineWorkoutId { get; set; }
    public string WorkoutName { get; set; } = "";
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public List<SetLog> Sets { get; set; } = new();
}

public class SetLog
{
    public int Id { get; set; }
    public int WorkoutSessionId { get; set; }
    public string ExerciseName { get; set; } = "";
    public int SetNumber { get; set; }
    public double Weight { get; set; }
    public string Unit { get; set; } = "lb";
    public int Reps { get; set; }
}

public class NutritionEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    public string Name { get; set; } = "";
    public double Calories { get; set; }
    public double Protein { get; set; }
    public double Carbs { get; set; }
    public double Fat { get; set; }
}

public class NutritionGoal
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public double Calories { get; set; }
    public double Protein { get; set; }
    public double Carbs { get; set; }
    public double Fat { get; set; }
}
