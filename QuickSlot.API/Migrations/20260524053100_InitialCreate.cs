using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickSlot.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Slots_SlotId",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "Slots",
                newName: "SlotDate");

            migrationBuilder.RenameColumn(
                name: "ExpiryDate",
                table: "Offers",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "Capacity",
                table: "Offers",
                newName: "TotalCapacity");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Businesses",
                newName: "Phone");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Slots",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Offers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Offers",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercentage",
                table: "Offers",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "EndDate",
                table: "Offers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EndTime",
                table: "Offers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaxBookingPerCustomer",
                table: "Offers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "StartDate",
                table: "Offers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StartTime",
                table: "Offers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TermsAndConditions",
                table: "Offers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Businesses",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BusinessType",
                table: "Businesses",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Businesses",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Businesses",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Businesses",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OwnerName",
                table: "Businesses",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerEmail",
                table: "Bookings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "OfferId",
                table: "Bookings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SpecialNote",
                table: "Bookings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BookingReference",
                table: "Bookings",
                column: "BookingReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_OfferId",
                table: "Bookings",
                column: "OfferId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Offers_OfferId",
                table: "Bookings",
                column: "OfferId",
                principalTable: "Offers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Slots_SlotId",
                table: "Bookings",
                column: "SlotId",
                principalTable: "Slots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Offers_OfferId",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Slots_SlotId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_BookingReference",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_OfferId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Slots");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "DiscountPercentage",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "MaxBookingPerCustomer",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "TermsAndConditions",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "BusinessType",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "OwnerName",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "CustomerEmail",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "OfferId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SpecialNote",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "SlotDate",
                table: "Slots",
                newName: "Date");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Offers",
                newName: "ExpiryDate");

            migrationBuilder.RenameColumn(
                name: "TotalCapacity",
                table: "Offers",
                newName: "Capacity");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Businesses",
                newName: "Type");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Slots_SlotId",
                table: "Bookings",
                column: "SlotId",
                principalTable: "Slots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
