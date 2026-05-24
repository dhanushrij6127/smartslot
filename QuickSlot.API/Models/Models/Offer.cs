namespace QuickSlot.API.Models
{
    public class Offer
    {
        public int Id { get; set; }
        public int BusinessId { get; set; }
        public Business? Business { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string TermsAndConditions { get; set; } = string.Empty;

        public decimal OriginalPrice { get; set; }
        public decimal OfferPrice { get; set; }
        public decimal DiscountPercentage { get; set; }

        // FIX: renamed from Capacity → TotalCapacity (matches frontend field name)
        public int TotalCapacity { get; set; }
        public int BookedCount { get; set; } = 0;
        public int MaxBookingPerCustomer { get; set; } = 1;

        // FIX: was ExpiryDate (single date). Now proper StartDate + EndDate strings.
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;

        // Active | Draft | Paused | Expired | Cancelled
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<Slot> Slots { get; set; } = new();
    }
}