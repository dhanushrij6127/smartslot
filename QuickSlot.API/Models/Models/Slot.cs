namespace QuickSlot.API.Models
{
    public class Slot
    {
        public int Id { get; set; }
        public int OfferId { get; set; }
        public Offer? Offer { get; set; }

        // FIX: was "Date" — frontend sends and reads "slotDate"
        public string SlotDate { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int BookedCount { get; set; } = 0;

        // Available | Full | Closed | Expired | Cancelled
        public string Status { get; set; } = "Available";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Booking> Bookings { get; set; } = new();
    }
}