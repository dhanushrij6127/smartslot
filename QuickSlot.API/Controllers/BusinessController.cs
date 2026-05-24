using Microsoft.AspNetCore.Mvc;
using QuickSlot.API.Data;
using QuickSlot.API.Models;

namespace QuickSlot.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusinessController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        public BusinessController(AppDbContext ctx) { _ctx = ctx; }

        [HttpGet]
        public IActionResult GetAll() => Ok(_ctx.Businesses.ToList());

        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var b = _ctx.Businesses.Find(id);
            return b == null ? NotFound() : Ok(b);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Business b)
        {
            b.CreatedAt = DateTime.UtcNow;
            _ctx.Businesses.Add(b);
            _ctx.SaveChanges();
            return Ok(b);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Business u)
        {
            var b = _ctx.Businesses.Find(id);
            if (b == null) return NotFound();

            b.Name         = u.Name;
            b.BusinessType = u.BusinessType;
            b.OwnerName    = u.OwnerName;
            b.Phone        = u.Phone;
            b.Email        = u.Email;
            b.Address      = u.Address;
            b.City         = u.City;
            b.LogoUrl      = u.LogoUrl;
            b.OpeningTime  = u.OpeningTime;
            b.ClosingTime  = u.ClosingTime;

            _ctx.SaveChanges();
            return Ok(b);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var b = _ctx.Businesses.Find(id);
            if (b == null) return NotFound();
            _ctx.Businesses.Remove(b);
            _ctx.SaveChanges();
            return Ok(new { message = "Deleted." });
        }
    }
}