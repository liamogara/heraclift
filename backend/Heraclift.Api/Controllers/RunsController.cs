using System.Security.Claims;
using Heraclift.Api.Data;
using Heraclift.Api.Dtos;
using Heraclift.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Heraclift.Api.Controllers;

[ApiController]
[Route("api/runs")]
[Authorize]
public class RunsController : ControllerBase
{
    private readonly AppDbContext _db;
    public RunsController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static readonly Dictionary<string, double> PresetDistancesKm = new()
    {
        ["5K"] = 5.0,
        ["10K"] = 10.0,
        ["HalfMarathon"] = 21.0975,
        ["Marathon"] = 42.195
    };

    private static RunDto ToDto(RunLog r) =>
        new(r.Id, r.RaceType, r.DistanceKm, r.DurationSeconds, r.Date.ToString("yyyy-MM-dd"), r.Notes);

    [HttpGet]
    public async Task<List<RunDto>> List([FromQuery] int limit = 20) =>
        (await _db.RunLogs
            .Where(r => r.UserId == UserId)
            .OrderByDescending(r => r.Date).ThenByDescending(r => r.Id)
            .Take(limit).ToListAsync())
        .Select(ToDto).ToList();

    [HttpPost]
    public async Task<ActionResult<RunDto>> Create(RunRequest req)
    {
        if (!DateOnly.TryParse(req.Date, out var date))
            return BadRequest(new { error = "Date must be in yyyy-MM-dd format." });

        double distanceKm;
        if (PresetDistancesKm.TryGetValue(req.RaceType, out var preset))
        {
            distanceKm = preset;
        }
        else if (req.RaceType == "Custom")
        {
            if (req.DistanceKm is not double d || d <= 0)
                return BadRequest(new { error = "Custom runs require a distance greater than zero." });
            distanceKm = d;
        }
        else
        {
            return BadRequest(new { error = "Unknown race type." });
        }

        if (req.DurationSeconds <= 0)
            return BadRequest(new { error = "Duration must be greater than zero." });

        var run = new RunLog
        {
            UserId = UserId,
            RaceType = req.RaceType,
            DistanceKm = distanceKm,
            DurationSeconds = req.DurationSeconds,
            Date = date,
            Notes = req.Notes ?? ""
        };
        _db.RunLogs.Add(run);
        await _db.SaveChangesAsync();
        return ToDto(run);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var run = await _db.RunLogs.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (run is null) return NotFound();
        _db.RunLogs.Remove(run);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
