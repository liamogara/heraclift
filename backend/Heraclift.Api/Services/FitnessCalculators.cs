using Heraclift.Api.Dtos;

namespace Heraclift.Api.Services;

public static class FitnessCalculator
{
    /// <summary>
    /// Estimates one-rep max (1RM) using three standard formulas plus a percentage table.
    /// Formulas:
    /// Epley: weight * (1 + reps / 30)
    /// Brzycki: weight * 36 / (37 - reps)
    /// Lombardi: weight * reps^0.10
    /// </summary>
    public static OneRepMaxResponse OneRepMax(double weight, int reps)
    {
        if (reps < 1) reps = 1;

        double epley = reps == 1 ? weight : weight * (1 + reps / 30.0);
        double brzycki = reps >= 37 ? epley : weight * 36.0 / (37.0 - reps);
        double lombardi = weight * Math.Pow(reps, 0.10);
        double avg = (epley + brzycki + lombardi) / 3.0;

        // Training percentages of estimated 1RM
        var table = new Dictionary<int, double>();
        foreach (var pct in new[] { 95, 90, 85, 80, 75, 70, 65, 60 })
            table[pct] = Math.Round(avg * pct / 100.0 / 2.5) * 2.5;

        return new OneRepMaxResponse(
            Math.Round(epley, 1), Math.Round(brzycki, 1),
            Math.Round(lombardi, 1), Math.Round(avg, 1), table);
    }

    /// <summary>
    /// Mifflin-St Jeor BMR, scaled by activity level to TDEE, adjusted for goal,
    /// then split into macros (protein 1.8 g/kg, fat 25% of calories, remainder carbs).
    /// Formulas: 
    /// BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age + (5 for males, -161 for females)
    /// TDEE = BMR * activity factor
    /// </summary>
    public static TdeeResponse Tdee(TdeeRequest r)
    {
        double bmr = 10 * r.WeightKg + 6.25 * r.HeightCm - 5 * r.Age
                     + (r.Sex.Equals("male", StringComparison.OrdinalIgnoreCase) ? 5 : -161);

        double factor = r.ActivityLevel.ToLowerInvariant() switch
        {
            "sedentary" => 1.2,
            "light" => 1.375,
            "moderate" => 1.55,
            "active" => 1.725,
            "very_active" => 1.9,
            _ => 1.375
        };

        double tdee = bmr * factor;

        double target = r.Goal.ToLowerInvariant() switch
        {
            "cut" => tdee - 500,
            "bulk" => tdee + 350,
            _ => tdee
        };

        double protein = 1.8 * r.WeightKg;
        double fat = target * 0.25 / 9.0;
        double carbs = Math.Max(0, (target - protein * 4 - fat * 9) / 4.0);

        return new TdeeResponse(
            Math.Round(bmr), Math.Round(tdee), Math.Round(target),
            Math.Round(protein), Math.Round(carbs), Math.Round(fat));
    }

    /// <summary>
    /// Calculates Body Mass Index (BMI) and categorizes it.
    /// Formula: 
    /// BMI = weight (kg) / (height (m))^2
    /// </summary>
    public static BmiResponse Bmi(double weightKg, double heightCm)
    {
        double m = heightCm / 100.0;
        double bmi = weightKg / (m * m);
        string category = bmi switch
        {
            < 18.5 => "Underweight",
            < 25.0 => "Normal weight",
            < 30.0 => "Overweight",
            _ => "Obese"
        };
        return new BmiResponse(Math.Round(bmi, 1), category);
    }
}
