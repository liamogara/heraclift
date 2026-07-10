using Heraclift.Api.Data;
using Heraclift.Api.Dtos;
using Heraclift.Api.Models;
using Heraclift.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Heraclift.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public AuthController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || req.Password.Length < 8)
            return BadRequest(new { error = "Username is required and password must be at least 8 characters." });

        if (await _db.Users.AnyAsync(u => u.Username == req.Username || u.Email == req.Email))
            return Conflict(new { error = "That username or email is already taken." });

        var (hash, salt) = TokenService.HashPassword(req.Password);
        var user = new User { Username = req.Username.Trim(), Email = req.Email.Trim(), PasswordHash = hash, PasswordSalt = salt };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponse(_tokens.CreateToken(user), user.Username);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == req.Username || u.Email == req.Username);
        if (user is null || !TokenService.VerifyPassword(req.Password, user.PasswordHash, user.PasswordSalt))
            return Unauthorized(new { error = "Invalid username or password." });

        return new AuthResponse(_tokens.CreateToken(user), user.Username);
    }
}
