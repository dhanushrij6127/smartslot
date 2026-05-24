using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickSlot.API.Data;
using QuickSlot.API.Models;

namespace QuickSlot.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        public BookingsController(AppDbContext ctx) { _ctx = ctx; }

        // GET /api/bookings
        // FIX: returns slotDate, startTime, endTime, offerTitle, businessName
        //      so the manage-bookings table and dashboard populate correctly
        [HttpGet]
        public IActionResult GetAll()
        {
            var list = _ctx.Bookings
                .Include(b => b.Slot)
                .Include(b => b.Offer).ThenInclude(o => o!.Business)
                .OrderByDescending(b => b.CreatedAt)
                .ToList()
                .Select(Map);
            return Ok(list);
        }

        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var b = _ctx.Bookings
                .Include(x => x.Slot)
                .Include(x => x.Offer).ThenInclude(o => o!.Business)
                .FirstOrDefault(x => x.Id == id);
            return b == null ? NotFound() : Ok(Map(b));
        }

        // POST /api/bookings
        // FIX: full validation per PDF business rules:
        //   - slot must be Available
        //   - offer must be Active and not expired
        //   - enough seats in the slot
        //   - max booking per customer enforced by phone number
        // FIX: response includes slotDate, startTime so confirm page shows correct data
        [HttpPost]
        public IActionResult Create([FromBody] Booking booking)
        {
            // 1. Load slot + offer + business
            var slot = _ctx.Slots
                .Include(s => s.Offer).ThenInclude(o => o!.Business)
                .FirstOrDefault(s => s.Id == booking.SlotId);

            if (slot == null)
                return BadRequest(new { message = "Slot not found." });

            var offer = slot.Offer;
            if (offer == null)
                return BadRequest(new { message = "Offer not found." });

            // 2. Offer must be Active
            if (offer.Status != "Active")
                return BadRequest(new { message = "This offer is not active." });

            // 3. Offer must not be expired
            if (!string.IsNullOrEmpty(offer.EndDate) &&
                DateTime.TryParse(offer.EndDate, out var expiry) &&
                DateTime.UtcNow.Date > expiry.Date)
                return BadRequest(new { message = "This offer has expired." });

            // 4. Slot must be Available
            if (slot.Status != "Available")
                return BadRequest(new { message = $"Slot is {slot.Status}." });

            // 5. Enough seats
            int avail = slot.Capacity - slot.BookedCount;
            if (booking.PeopleCount > avail)
                return BadRequest(new { message = $"Only {avail} seat(s) left in this slot." });

            // 6. Max booking per customer (by phone, per offer)
            int already = _ctx.Bookings.Count(b =>
                b.CustomerPhone == booking.CustomerPhone &&
                b.OfferId == offer.Id &&
                b.Status != "Cancelled");

            if (already >= offer.MaxBookingPerCustomer)
                return BadRequest(new { message = $"You have already reached the booking limit ({offer.MaxBookingPerCustomer}) for this offer." });

            // 7. Generate unique reference
            string reference;
            do { reference = $"SS-{new Random().Next(1000, 9999)}"; }
            while (_ctx.Bookings.Any(b => b.BookingReference == reference));

            // 8. Save booking
            booking.OfferId          = offer.Id;
            booking.BookingReference = reference;
            booking.Status           = "Confirmed";
            booking.CreatedAt        = DateTime.UtcNow;
            booking.CustomerEmail    ??= "";
            booking.SpecialNote      ??= "";

            // 9. Update counts
            slot.BookedCount  += booking.PeopleCount;
            offer.BookedCount += booking.PeopleCount;
            if (slot.BookedCount >= slot.Capacity) slot.Status = "Full";

            _ctx.Bookings.Add(booking);
            _ctx.SaveChanges();

            // 10. Reload for full mapped response (so frontend confirm page gets all fields)
            var created = _ctx.Bookings
                .Include(b => b.Slot)
                .Include(b => b.Offer).ThenInclude(o => o!.Business)
                .First(b => b.Id == booking.Id);

            return Ok(Map(created));
        }

        // PUT /api/bookings/{id}/status
        [HttpPut("{id}/status")]
        public IActionResult UpdateStatus(int id, [FromBody] BookingStatusDto dto)
        {
            var b = _ctx.Bookings.Find(id);
            if (b == null) return NotFound();
            b.Status = dto.Status;
            _ctx.SaveChanges();

            var updated = _ctx.Bookings
                .Include(x => x.Slot)
                .Include(x => x.Offer).ThenInclude(o => o!.Business)
                .First(x => x.Id == id);

            return Ok(Map(updated));
        }

        // ── Mapping helper ────────────────────────────────────────────────────
        // FIX: every field the frontend reads is here
        private static object Map(Booking b) => new
        {
            b.Id,
            b.BookingReference,
            b.OfferId,
            b.SlotId,
            b.CustomerName,
            b.CustomerPhone,
            b.CustomerEmail,
            b.SpecialNote,
            b.PeopleCount,
            b.Status,
            b.CreatedAt,

            // Offer fields
            OfferTitle    = b.Offer?.Title       ?? "",
            OfferPrice    = b.Offer?.OfferPrice  ?? 0,
            Category      = b.Offer?.Category    ?? "",
            TotalPaid     = (b.Offer?.OfferPrice ?? 0) * b.PeopleCount,

            // Business fields
            BusinessName  = b.Offer?.Business?.Name         ?? "",
            BusinessType  = b.Offer?.Business?.BusinessType ?? "",
            BusinessCity  = b.Offer?.Business?.City         ?? "",

            // Slot fields — frontend needs these for the confirmation page + table
            SlotDate      = b.Slot?.SlotDate   ?? "",
            StartTime     = b.Slot?.StartTime  ?? "",
            EndTime       = b.Slot?.EndTime    ?? "",
            SlotCapacity  = b.Slot?.Capacity   ?? 0,
        };
    }

    public class BookingStatusDto { public string Status { get; set; } = string.Empty; }
}