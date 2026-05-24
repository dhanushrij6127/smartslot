using Microsoft.EntityFrameworkCore;
using QuickSlot.API.Models;

namespace QuickSlot.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Business> Businesses { get; set; }
        public DbSet<Offer> Offers { get; set; }
        public DbSet<Slot> Slots { get; set; }
        public DbSet<Booking> Bookings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Offer → Business
            modelBuilder.Entity<Offer>()
                .HasOne(o => o.Business)
                .WithMany(b => b.Offers)
                .HasForeignKey(o => o.BusinessId)
                .OnDelete(DeleteBehavior.Cascade);

            // Slot → Offer
            modelBuilder.Entity<Slot>()
                .HasOne(s => s.Offer)
                .WithMany(o => o.Slots)
                .HasForeignKey(s => s.OfferId)
                .OnDelete(DeleteBehavior.Cascade);

            // Booking → Slot
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Slot)
                .WithMany(s => s.Bookings)
                .HasForeignKey(b => b.SlotId)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking → Offer (direct link for easy querying)
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Offer)
                .WithMany()
                .HasForeignKey(b => b.OfferId)
                .OnDelete(DeleteBehavior.Restrict);

            // SQLite needs TEXT for decimal
            modelBuilder.Entity<Offer>().Property(o => o.OriginalPrice).HasColumnType("TEXT");
            modelBuilder.Entity<Offer>().Property(o => o.OfferPrice).HasColumnType("TEXT");
            modelBuilder.Entity<Offer>().Property(o => o.DiscountPercentage).HasColumnType("TEXT");

            // Unique booking reference
            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.BookingReference)
                .IsUnique();
        }
    }
}