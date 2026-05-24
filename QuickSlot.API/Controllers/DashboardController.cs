using Microsoft.AspNetCore.Mvc;
using QuickSlot.API.Data;

namespace QuickSlot.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        public DashboardController(AppDbContext ctx) { _ctx = ctx; }

        // GET /api/dashboard/summary
        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            var today        = DateTime.UtcNow.Date;
            var totalOffers  = _ctx.Offers.Count();
            var activeOffers = _ctx.Offers.Count(o => o.Status == "Active");
            var totalBk      = _ctx.Bookings.Count();
            var todayBk      = _ctx.Bookings.Count(b => b.CreatedAt.Date == today);
            var totalCap     = _ctx.Offers.Sum(o => (int?)o.TotalCapacity) ?? 0;
            var bookedSeats  = _ctx.Bookings.Sum(b => (int?)b.PeopleCount) ?? 0;
            var availSeats   = Math.Max(0, totalCap - bookedSeats);
            var convRate     = totalCap > 0
                ? Math.Round((double)bookedSeats / totalCap * 100, 1) : 0;

            return Ok(new
            {
                totalOffers,
                activeOffers,
                totalBookings  = totalBk,
                todayBookings  = todayBk,
                totalCapacity  = totalCap,
                bookedSeats,
                availableSeats = availSeats,
                conversionRate = convRate,
            });
        }
    }
}