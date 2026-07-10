using Heraclift.Api.Dtos;
using Heraclift.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Heraclift.Api.Controllers;

[ApiController]
[Route("api/calculators")]
public class CalculatorsController : ControllerBase
{
    /// <summary>Estimate one-rep max from a weight and rep count (Epley, Brzycki, Lombardi).</summary>
    [HttpPost("one-rep-max")]
    public ActionResult<OneRepMaxResponse> OneRepMax(OneRepMaxRequest req)
    {
        if (req.Weight <= 0 || req.Reps < 1 || req.Reps > 30)
            return BadRequest(new { error = "Enter a weight above 0 and reps between 1 and 30." });
        return FitnessCalculator.OneRepMax(req.Weight, req.Reps);
    }

    /// <summary>Daily calories and macros via Mifflin-St Jeor.</summary>
    [HttpPost("tdee")]
    public ActionResult<TdeeResponse> Tdee(TdeeRequest req)
    {
        if (req.WeightKg <= 0 || req.HeightCm <= 0 || req.Age is < 10 or > 120)
            return BadRequest(new { error = "Enter a valid weight, height, and age." });
        return FitnessCalculator.Tdee(req);
    }

    /// <summary>Calculate Body Mass Index (BMI) from weight and height.</summary>
    [HttpPost("bmi")]
    public ActionResult<BmiResponse> Bmi(BmiRequest req)
    {
        if (req.WeightKg <= 0 || req.HeightCm <= 0)
            return BadRequest(new { error = "Enter a valid weight and height." });
        return FitnessCalculator.Bmi(req.WeightKg, req.HeightCm);
    }
}
