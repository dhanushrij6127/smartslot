namespace QuickSlot.API.Models
{
    public class Booking
    {
        public int Id { get; set; }
        public string BookingReference { get; set; } = string.Empty;

        // FIX: added OfferId (direct FK to Offer, not just through Slot)
        public int OfferId { get; set; }
        public Offer? Offer { get; set; }

        public int SlotId { get; set; }
        public Slot? Slot { get; set; }

        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;

        // FIX: added CustomerEmail and SpecialNote (frontend sends both)
        public string CustomerEmail { get; set; } = string.Empty;
        public string SpecialNote { get; set; } = string.Empty;

        public int PeopleCount { get; set; } = 1;

        // Pending | Confirmed | Cancelled | Completed | NoShow
        public string Status { get; set; } = "Confirmed";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}