using Heraclift.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Heraclift.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Routine> Routines => Set<Routine>();
    public DbSet<RoutineWorkout> RoutineWorkouts => Set<RoutineWorkout>();
    public DbSet<RoutineExercise> RoutineExercises => Set<RoutineExercise>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<SetLog> SetLogs => Set<SetLog>();
    public DbSet<NutritionEntry> NutritionEntries => Set<NutritionEntry>();
    public DbSet<NutritionGoal> NutritionGoals => Set<NutritionGoal>();
    public DbSet<RunLog> RunLogs => Set<RunLog>();
    public DbSet<ExerciseWeight> ExerciseWeights => Set<ExerciseWeight>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>().HasIndex(u => u.Username).IsUnique();
        mb.Entity<User>().HasIndex(u => u.Email).IsUnique();

        mb.Entity<Routine>()
          .HasMany(r => r.Workouts).WithOne().HasForeignKey(w => w.RoutineId)
          .OnDelete(DeleteBehavior.Cascade);

        mb.Entity<RoutineWorkout>()
          .HasMany(w => w.Exercises).WithOne().HasForeignKey(e => e.RoutineWorkoutId)
          .OnDelete(DeleteBehavior.Cascade);

        mb.Entity<WorkoutSession>()
          .HasMany(s => s.Sets).WithOne().HasForeignKey(s => s.WorkoutSessionId)
          .OnDelete(DeleteBehavior.Cascade);

        mb.Entity<User>()
          .HasOne(u => u.NutritionGoal).WithOne().HasForeignKey<NutritionGoal>(g => g.UserId)
          .OnDelete(DeleteBehavior.Cascade);

        mb.Entity<NutritionEntry>().HasIndex(e => new { e.UserId, e.Date });

        mb.Entity<RunLog>().HasIndex(r => new { r.UserId, r.Date });

        mb.Entity<ExerciseWeight>().HasIndex(e => new { e.UserId, e.ExerciseName }).IsUnique();
    }
}
