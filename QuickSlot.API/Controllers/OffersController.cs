using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickSlot.API.Data;
using QuickSlot.API.Models;

namespace QuickSlot.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OffersController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        public OffersController(AppDbContext ctx) { _ctx = ctx; }

        // GET /api/offers
        // FIX: returns ALL fields frontend needs including businessName, businessType,
        //      startDate, endDate, category, discountPercentage, availableCount, totalCapacity
        [HttpGet]
        public IActionResult GetAll()
        {
            var list = _ctx.Offers
                .Include(o => o.Business)
                .OrderByDescending(o => o.CreatedAt)
                .ToList()
                .Select(Map);
            return Ok(list);
        }

        // GET /api/offers/{id}
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var o = _ctx.Offers.Include(x => x.Business).FirstOrDefault(x => x.Id == id);
            return o == null ? NotFound() : Ok(Map(o));
        }

        // POST /api/offers
        // FIX: reads all new fields (StartDate, EndDate, Category, etc.)
        //      Returns full mapped object so frontend can add it to state immediately
        [HttpPost]
        public IActionResult Create([FromBody] Offer offer)
        {
            if (offer.DiscountPercentage == 0 && offer.OriginalPrice > 0)
                offer.DiscountPercentage = Math.Round(
                    (offer.OriginalPrice - offer.OfferPrice) / offer.OriginalPrice * 100, 2);

            offer.BookedCount = 0;
            offer.CreatedAt = offer.UpdatedAt = DateTime.UtcNow;

            _ctx.Offers.Add(offer);
            _ctx.SaveChanges();

            // Reload so Business navigation property is populated
            var created = _ctx.Offers
                .Include(x => x.Business)
                .First(x => x.Id == offer.Id);

            return Ok(Map(created));
        }

        // PUT /api/offers/{id}
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Offer u)
        {
            var o = _ctx.Offers.Find(id);
            if (o == null) return NotFound();

            o.Title                = u.Title;
            o.Description          = u.Description;
            o.Category             = u.Category;
            o.OriginalPrice        = u.OriginalPrice;
            o.OfferPrice           = u.OfferPrice;
            o.DiscountPercentage   = u.DiscountPercentage;
            o.TotalCapacity        = u.TotalCapacity;
            o.MaxBookingPerCustomer = u.MaxBookingPerCustomer;
            o.Status               = u.Status;
            o.StartDate            = u.StartDate;
            o.EndDate              = u.EndDate;
            o.StartTime            = u.StartTime;
            o.EndTime              = u.EndTime;
            o.TermsAndConditions   = u.TermsAndConditions;
            o.UpdatedAt            = DateTime.UtcNow;

            _ctx.SaveChanges();
            return Ok(Map(o));
        }

        // PUT /api/offers/{id}/status  — quick status change from manage offers table
        [HttpPut("{id}/status")]
        public IActionResult UpdateStatus(int id, [FromBody] StatusDto dto)
        {
            var o = _ctx.Offers.Find(id);
            if (o == null) return NotFound();
            o.Status = dto.Status;
            o.UpdatedAt = DateTime.UtcNow;
            _ctx.SaveChanges();
            return Ok(new { o.Id, o.Status });
        }

        // DELETE /api/offers/{id}
        // FIX: cascade-deletes slots and bookings first so no FK error
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var offer = _ctx.Offers.Find(id);
            if (offer == null) return NotFound();

            var slotIds = _ctx.Slots
                .Where(s => s.OfferId == id)
                .Select(s => s.Id)
                .ToList();

            var bookings = _ctx.Bookings
                .Where(b => slotIds.Contains(b.SlotId) || b.OfferId == id)
                .ToList();

            _ctx.Bookings.RemoveRange(bookings);
            _ctx.Slots.RemoveRange(_ctx.Slots.Where(s => s.OfferId == id));
            _ctx.Offers.Remove(offer);
            _ctx.SaveChanges();

            return Ok(new { message = "Offer deleted." });
        }

        // GET /api/offers/{offerId}/slots
        [HttpGet("{offerId}/slots")]
        public IActionResult GetSlots(int offerId)
        {
            var slots = _ctx.Slots
                .Where(s => s.OfferId == offerId)
                .OrderBy(s => s.SlotDate).ThenBy(s => s.StartTime)
                .ToList()
                .Select(MapSlot);
            return Ok(slots);
        }

        // ── Mapping helpers ───────────────────────────────────────────────────
        private static object Map(Offer o) => new
        {
            o.Id,
            o.BusinessId,
            // FIX: these are the exact field names frontend's norm() function reads
            BusinessName    = o.Business?.Name         ?? "",
            BusinessType    = o.Business?.BusinessType ?? "",
            BusinessCity    = o.Business?.City         ?? "",
            BusinessAddress = o.Business?.Address      ?? "",
            o.Title,
            o.Description,
            o.Category,
            o.TermsAndConditions,
            o.OriginalPrice,
            o.OfferPrice,
            o.DiscountPercentage,
            o.TotalCapacity,
            o.BookedCount,
            AvailableCount       = o.TotalCapacity - o.BookedCount,  // FIX: frontend reads availableCount
            o.MaxBookingPerCustomer,
            o.Status,
            o.StartDate,
            o.EndDate,
            o.StartTime,
            o.EndTime,
            o.CreatedAt,
            o.UpdatedAt,
        };

        private static object MapSlot(Slot s) => new
        {
            s.Id,
            s.OfferId,
            s.SlotDate,         // FIX: was "date" — frontend reads "slotDate"
            s.StartTime,
            s.EndTime,
            s.Capacity,
            s.BookedCount,
            AvailableCount = s.Capacity - s.BookedCount,
            s.Status,
            s.CreatedAt,
        };
    }

    public class StatusDto { public string Status { get; set; } = string.Empty; }
}