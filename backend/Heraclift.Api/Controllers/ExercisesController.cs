using System.Security.Claims;
using Heraclift.Api.Data;
using Heraclift.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Heraclift.Api.Controllers;

[ApiController]
[Route("api/exercises")]
[Authorize]
public class ExercisesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ExercisesController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The user's last-used weight for each exercise, so sets can be pre-filled.</summary>
    [HttpGet("weights")]
    public async Task<List<ExerciseWeightDto>> Weights() =>
        (await _db.ExerciseWeights.Where(e => e.UserId == UserId).ToListAsync())
        .Select(e => new ExerciseWeightDto(e.ExerciseName, e.Weight, e.Unit))
        .ToList();
}
