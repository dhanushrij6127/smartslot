using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using QuickSlot.API.Data;
using QuickSlot.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace QuickSlot.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        private readonly IConfiguration _cfg;

        public AuthController(AppDbContext ctx, IConfiguration cfg)
        {
            _ctx = ctx;
            _cfg = cfg;
        }

        // POST /api/auth/register
        [HttpPost("register")]
        public IActionResult Register([FromBody] User user)
        {
            if (_ctx.Users.Any(x => x.Email == user.Email))
                return BadRequest(new { message = "User already exists." });

            user.Role = "Admin";
            user.CreatedAt = DateTime.UtcNow;
            _ctx.Users.Add(user);
            _ctx.SaveChanges();
            return Ok(new { message = "Registered successfully." });
        }

        // POST /api/auth/login
        // FIX: frontend sends { "email": "...", "password": "..." }
        // Old code read PasswordHash from request body — field name mismatch caused every login to fail.
        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;   // ← "password" not "passwordHash"
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            // Compare plain password against PasswordHash column (demo — no real hashing)
            var user = _ctx.Users.FirstOrDefault(x =>
                x.Email == req.Email &&
                x.PasswordHash == req.Password);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            var key = Encoding.UTF8.GetBytes(
                _cfg["Jwt:Key"] ?? "THIS_IS_MY_SUPER_SECRET_KEY_12345");

            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Email),
                    new Claim(ClaimTypes.Role, user.Role),
                }),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = _cfg["Jwt:Issuer"],
                Audience = _cfg["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature),
            };

            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateToken(descriptor);

            // FIX: return field is "token" — frontend reads data.token
            return Ok(new
            {
                message = "Login successful",
                token = handler.WriteToken(token),
                email = user.Email,
                role = user.Role,
            });
        }

        [Authorize]
        [HttpGet("secure")]
        public IActionResult Secure() =>
            Ok(new { message = "Authorized", email = User.Identity?.Name });
    }
}