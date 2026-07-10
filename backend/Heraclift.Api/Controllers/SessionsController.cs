using System.Security.Claims;
using Heraclift.Api.Data;
using Heraclift.Api.Dtos;
using Heraclift.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Heraclift.Api.Controllers;

[ApiController]
[Route("api/sessions")]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SessionsController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static SessionDto ToDto(WorkoutSession s) => new(
        s.Id, s.RoutineId, s.RoutineWorkoutId, s.WorkoutName, s.StartedAt, s.CompletedAt,
        s.Sets.OrderBy(x => x.Id)
            .Select(x => new SetLogDto(x.Id, x.ExerciseName, x.SetNumber, x.Weight, x.Unit, x.Reps))
            .ToList());

    /// <summary>The user's in-progress session.</summary>
    [HttpGet("active")]
    public async Task<ActionResult<SessionDto?>> Active()
    {
        var s = await _db.WorkoutSessions.Include(x => x.Sets)
            .Where(x => x.UserId == UserId && x.CompletedAt == null)
            .OrderByDescending(x => x.StartedAt).FirstOrDefaultAsync();
        return s is null ? Ok(null) : ToDto(s);
    }

    [HttpGet("history")]
    public async Task<List<SessionDto>> History([FromQuery] int limit = 20) =>
        (await _db.WorkoutSessions.Include(x => x.Sets)
            .Where(x => x.UserId == UserId && x.CompletedAt != null)
            .OrderByDescending(x => x.CompletedAt).Take(limit).ToListAsync())
        .Select(ToDto).ToList();

    [HttpPost("start")]
    public async Task<ActionResult<SessionDto>> Start(StartSessionRequest req)
    {
        var existing = await _db.WorkoutSessions
            .FirstOrDefaultAsync(x => x.UserId == UserId && x.CompletedAt == null);
        if (existing is not null)
            return Conflict(new { error = "You already have a workout in progress. Finish or abandon it first." });

        var session = new WorkoutSession
        {
            UserId = UserId,
            RoutineId = req.RoutineId,
            RoutineWorkoutId = req.RoutineWorkoutId,
            WorkoutName = req.WorkoutName
        };
        _db.WorkoutSessions.Add(session);
        await _db.SaveChangesAsync();
        return ToDto(session);
    }

    [HttpPost("{id:int}/sets")]
    public async Task<ActionResult<SetLogDto>> LogSet(int id, LogSetRequest req)
    {
        var session = await _db.WorkoutSessions
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId && x.CompletedAt == null);
        if (session is null) return NotFound();

        var set = new SetLog
        {
            WorkoutSessionId = id,
            ExerciseName = req.ExerciseName,
            SetNumber = req.SetNumber,
            Weight = req.Weight,
            Unit = req.Unit,
            Reps = req.Reps
        };
        _db.SetLogs.Add(set);
        await _db.SaveChangesAsync();
        return new SetLogDto(set.Id, set.ExerciseName, set.SetNumber, set.Weight, set.Unit, set.Reps);
    }

    [HttpDelete("{id:int}/sets/{setId:int}")]
    public async Task<IActionResult> DeleteSet(int id, int setId)
    {
        var set = await _db.SetLogs
            .Where(s => s.Id == setId && s.WorkoutSessionId == id)
            .Join(_db.WorkoutSessions.Where(w => w.UserId == UserId), s => s.WorkoutSessionId, w => w.Id, (s, w) => s)
            .FirstOrDefaultAsync();
        if (set is null) return NotFound();
        _db.SetLogs.Remove(set);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Completes the session and advances the routine's "current workout" pointer.</summary>
    [HttpPost("{id:int}/complete")]
    public async Task<ActionResult<SessionDto>> Complete(int id)
    {
        var session = await _db.WorkoutSessions.Include(x => x.Sets)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId && x.CompletedAt == null);
        if (session is null) return NotFound();

        session.CompletedAt = DateTime.UtcNow;

        if (session.RoutineId is int routineId)
        {
            var routine = await _db.Routines.Include(r => r.Workouts)
                .FirstOrDefaultAsync(r => r.Id == routineId && r.UserId == UserId);
            if (routine is not null && routine.Workouts.Count > 0)
                // Advance to the next workout in the routine, wrapping around if necessary.
                routine.CurrentWorkoutIndex = (routine.CurrentWorkoutIndex + 1) % routine.Workouts.Count;
        }

        await _db.SaveChangesAsync();
        return ToDto(session);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Abandon(int id)
    {
        var session = await _db.WorkoutSessions
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (session is null) return NotFound();
        _db.WorkoutSessions.Remove(session);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
