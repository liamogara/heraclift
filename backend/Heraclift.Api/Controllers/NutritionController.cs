using System.Security.Claims;
using Heraclift.Api.Data;
using Heraclift.Api.Dtos;
using Heraclift.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Heraclift.Api.Controllers;

[ApiController]
[Route("api/nutrition")]
[Authorize]
public class NutritionController : ControllerBase
{
    private readonly AppDbContext _db;
    public NutritionController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>All food entries for a given day (yyyy-MM-dd), plus the user's goals and daily totals.</summary>
    [HttpGet("day/{date}")]
    public async Task<IActionResult> Day(string date)
    {
        if (!DateOnly.TryParse(date, out var d))
            return BadRequest(new { error = "Date must be in yyyy-MM-dd format." });

        var entries = await _db.NutritionEntries
            .Where(e => e.UserId == UserId && e.Date == d)
            .OrderBy(e => e.Id).ToListAsync();
        var goal = await _db.NutritionGoals.FirstOrDefaultAsync(g => g.UserId == UserId);

        return Ok(new
        {
            date = d.ToString("yyyy-MM-dd"),
            entries,
            totals = new
            {
                calories = entries.Sum(e => e.Calories),
                protein = entries.Sum(e => e.Protein),
                carbs = entries.Sum(e => e.Carbs),
                fat = entries.Sum(e => e.Fat)
            },
            goal
        });
    }

    [HttpPost("entries")]
    public async Task<ActionResult<NutritionEntry>> AddEntry(NutritionEntryRequest req)
    {
        if (!DateOnly.TryParse(req.Date, out var d))
            return BadRequest(new { error = "Date must be in yyyy-MM-dd format." });

        var entry = new NutritionEntry
        {
            UserId = UserId, Date = d, Name = req.Name,
            Calories = req.Calories, Protein = req.Protein, Carbs = req.Carbs, Fat = req.Fat
        };
        _db.NutritionEntries.Add(entry);
        await _db.SaveChangesAsync();
        return entry;
    }

    [HttpDelete("entries/{id:int}")]
    public async Task<IActionResult> DeleteEntry(int id)
    {
        var entry = await _db.NutritionEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (entry is null) return NotFound();
        _db.NutritionEntries.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("goal")]
    public async Task<ActionResult<NutritionGoal?>> GetGoal() =>
        await _db.NutritionGoals.FirstOrDefaultAsync(g => g.UserId == UserId);

    [HttpPut("goal")]
    public async Task<ActionResult<NutritionGoal>> SetGoal(NutritionGoalRequest req)
    {
        var goal = await _db.NutritionGoals.FirstOrDefaultAsync(g => g.UserId == UserId);
        if (goal is null)
        {
            goal = new NutritionGoal { UserId = UserId };
            _db.NutritionGoals.Add(goal);
        }
        goal.Calories = req.Calories;
        goal.Protein = req.Protein;
        goal.Carbs = req.Carbs;
        goal.Fat = req.Fat;
        await _db.SaveChangesAsync();
        return goal;
    }
}
