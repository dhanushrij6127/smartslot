using Microsoft.AspNetCore.Mvc;
using QuickSlot.API.Data;
using QuickSlot.API.Models;

namespace QuickSlot.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SlotsController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        public SlotsController(AppDbContext ctx) { _ctx = ctx; }

        [HttpGet]
        public IActionResult GetAll() =>
            Ok(_ctx.Slots.OrderBy(s => s.SlotDate).ThenBy(s => s.StartTime).ToList().Select(Map));

        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var s = _ctx.Slots.Find(id);
            return s == null ? NotFound() : Ok(Map(s));
        }

        [HttpPost]
        public IActionResult Create([FromBody] Slot slot)
        {
            if (!_ctx.Offers.Any(o => o.Id == slot.OfferId))
                return BadRequest(new { message = "Offer not found." });

            slot.BookedCount = 0;
            slot.Status = "Available";
            slot.CreatedAt = DateTime.UtcNow;

            _ctx.Slots.Add(slot);
            _ctx.SaveChanges();
            return Ok(Map(slot));
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Slot u)
        {
            var s = _ctx.Slots.Find(id);
            if (s == null) return NotFound();

            s.SlotDate  = u.SlotDate;
            s.StartTime = u.StartTime;
            s.EndTime   = u.EndTime;
            s.Capacity  = u.Capacity;
            s.Status    = u.Status;

            _ctx.SaveChanges();
            return Ok(Map(s));
        }

        // PUT /api/slots/{id}/status
        [HttpPut("{id}/status")]
        public IActionResult UpdateStatus(int id, [FromBody] SlotStatusDto dto)
        {
            var s = _ctx.Slots.Find(id);
            if (s == null) return NotFound();
            s.Status = dto.Status;
            _ctx.SaveChanges();
            return Ok(Map(s));
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var s = _ctx.Slots.Find(id);
            if (s == null) return NotFound();

            // Remove bookings on this slot first
            _ctx.Bookings.RemoveRange(_ctx.Bookings.Where(b => b.SlotId == id));
            _ctx.Slots.Remove(s);
            _ctx.SaveChanges();
            return Ok(new { message = "Slot deleted." });
        }

        private static object Map(Slot s) => new
        {
            s.Id,
            s.OfferId,
            s.SlotDate,
            s.StartTime,
            s.EndTime,
            s.Capacity,
            s.BookedCount,
            AvailableCount = s.Capacity - s.BookedCount,
            s.Status,
            s.CreatedAt,
        };
    }

    public class SlotStatusDto { public string Status { get; set; } = string.Empty; }
}