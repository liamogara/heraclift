using System.Security.Claims;
using Heraclift.Api.Data;
using Heraclift.Api.Dtos;
using Heraclift.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Heraclift.Api.Controllers;

[ApiController]
[Route("api/routines")]
[Authorize]
public class RoutinesController : ControllerBase
{
    private readonly AppDbContext _db;
    public RoutinesController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static RoutineDto ToDto(Routine r) => new(
        r.Id, r.Name, r.Description, r.IsActive, r.CurrentWorkoutIndex,
        r.Workouts.OrderBy(w => w.Order).Select(w => new WorkoutDto(
            w.Id, w.Name, w.Order,
            w.Exercises.OrderBy(e => e.Order)
                .Select(e => new ExerciseDto(e.Id, e.Name, e.TargetSets, e.TargetReps, e.Order, e.Notes))
                .ToList())).ToList());

    [HttpGet]
    public async Task<List<RoutineDto>> GetAll() =>
        (await _db.Routines.Include(r => r.Workouts).ThenInclude(w => w.Exercises)
            .Where(r => r.UserId == UserId).ToListAsync())
        .Select(ToDto).ToList();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RoutineDto>> Get(int id)
    {
        var r = await _db.Routines.Include(x => x.Workouts).ThenInclude(w => w.Exercises)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        return r is null ? NotFound() : ToDto(r);
    }

    [HttpPost]
    public async Task<ActionResult<RoutineDto>> Create(SaveRoutine req)
    {
        var routine = new Routine
        {
            UserId = UserId,
            Name = req.Name,
            Description = req.Description ?? "",
            Workouts = req.Workouts.Select((w, wi) => new RoutineWorkout
            {
                Name = w.Name,
                Order = wi,
                Exercises = w.Exercises.Select((e, ei) => new RoutineExercise
                {
                    Name = e.Name, TargetSets = e.TargetSets, TargetReps = e.TargetReps,
                    Order = ei, Notes = e.Notes ?? ""
                }).ToList()
            }).ToList()
        };

        // First routine is automatically active
        routine.IsActive = !await _db.Routines.AnyAsync(r => r.UserId == UserId);

        _db.Routines.Add(routine);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = routine.Id }, ToDto(routine));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RoutineDto>> Update(int id, SaveRoutine req)
    {
        var routine = await _db.Routines.Include(r => r.Workouts).ThenInclude(w => w.Exercises)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (routine is null) return NotFound();

        routine.Name = req.Name;
        routine.Description = req.Description ?? "";
        routine.Workouts.Clear();
        routine.Workouts.AddRange(req.Workouts.Select((w, wi) => new RoutineWorkout
        {
            Name = w.Name,
            Order = wi,
            Exercises = w.Exercises.Select((e, ei) => new RoutineExercise
            {
                Name = e.Name, TargetSets = e.TargetSets, TargetReps = e.TargetReps,
                Order = ei, Notes = e.Notes ?? ""
            }).ToList()
        }));
        if (routine.CurrentWorkoutIndex >= routine.Workouts.Count)
            routine.CurrentWorkoutIndex = 0;

        await _db.SaveChangesAsync();
        return ToDto(routine);
    }

    [HttpPost("{id:int}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        var routines = await _db.Routines.Where(r => r.UserId == UserId).ToListAsync();
        var target = routines.FirstOrDefault(r => r.Id == id);
        if (target is null) return NotFound();
        foreach (var r in routines) r.IsActive = r.Id == id;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var routine = await _db.Routines.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (routine is null) return NotFound();
        _db.Routines.Remove(routine);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
