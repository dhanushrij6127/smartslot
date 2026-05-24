# SmartSlot — Database Schema & ER Diagram

## ER Diagram (Text)

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────┐
│    User     │        │     Business     │        │    Offer    │
│─────────────│        │──────────────────│        │─────────────│
│ Id (PK)     │        │ Id (PK)          │1      *│ Id (PK)     │
│ Email       │        │ Name             │────────│ BusinessId  │
│ PasswordHash│        │ BusinessType     │        │ Title       │
│ Name        │        │ OwnerName        │        │ Description │
│ Role        │        │ Phone            │        │ Category    │
│ CreatedAt   │        │ Email            │        │ OriginalPrice│
└─────────────┘        │ Address          │        │ OfferPrice  │
                       │ City             │        │ DiscountPct │
                       │ LogoUrl          │        │ TotalCapacity│
                       │ OpeningTime      │        │ BookedCount │
                       │ ClosingTime      │        │ MaxBookingPerCustomer│
                       │ CreatedAt        │        │ StartDate   │
                       └──────────────────┘        │ EndDate     │
                                                   │ StartTime   │
                                                   │ EndTime     │
                       ┌──────────────────┐        │ Status      │
                       │      Slot        │        │ CreatedAt   │
                       │──────────────────│        │ UpdatedAt   │
                       │ Id (PK)          │*      1└─────────────┘
                       │ OfferId (FK)     │────────────────┘
                       │ SlotDate         │
                       │ StartTime        │        ┌─────────────────┐
                       │ EndTime          │        │    Booking      │
                       │ Capacity         │        │─────────────────│
                       │ BookedCount      │1      *│ Id (PK)         │
                       │ Status           │────────│ SlotId (FK)     │
                       │ CreatedAt        │        │ OfferId (FK)    │
                       └──────────────────┘        │ BookingReference│
                                                   │ CustomerName    │
                                                   │ CustomerPhone   │
                                                   │ CustomerEmail   │
                                                   │ PeopleCount     │
                                                   │ SpecialNote     │
                                                   │ Status          │
                                                   │ CreatedAt       │
                                                   └─────────────────┘
```

## Relationships

| From     | To       | Type        | FK            |
|----------|----------|-------------|---------------|
| Business | Offer    | One-to-Many | Offer.BusinessId |
| Offer    | Slot     | One-to-Many | Slot.OfferId  |
| Slot     | Booking  | One-to-Many | Booking.SlotId |
| Offer    | Booking  | One-to-Many | Booking.OfferId (direct FK for easy querying) |

## Table Details

### User
| Column       | Type     | Notes              |
|--------------|----------|--------------------|
| Id           | INTEGER  | PK, auto-increment |
| Email        | TEXT     | Unique             |
| PasswordHash | TEXT     |                    |
| Name         | TEXT     |                    |
| Role         | TEXT     | Default: "Admin"   |
| CreatedAt    | DATETIME |                    |

### Business
| Column       | Type     | Notes              |
|--------------|----------|--------------------|
| Id           | INTEGER  | PK, auto-increment |
| Name         | TEXT     |                    |
| BusinessType | TEXT     | Gym/Salon/Spa etc. |
| OwnerName    | TEXT     |                    |
| Phone        | TEXT     |                    |
| Email        | TEXT     |                    |
| Address      | TEXT     |                    |
| City         | TEXT     |                    |
| LogoUrl      | TEXT     |                    |
| OpeningTime  | TEXT     |                    |
| ClosingTime  | TEXT     |                    |
| CreatedAt    | DATETIME |                    |

### Offer
| Column               | Type     | Notes                          |
|----------------------|----------|--------------------------------|
| Id                   | INTEGER  | PK                             |
| BusinessId           | INTEGER  | FK → Business, Cascade Delete  |
| Title                | TEXT     |                                |
| Description          | TEXT     |                                |
| Category             | TEXT     | Fitness/Beauty/Sports etc.     |
| OriginalPrice        | TEXT     | SQLite decimal stored as TEXT  |
| OfferPrice           | TEXT     |                                |
| DiscountPercentage   | TEXT     |                                |
| TotalCapacity        | INTEGER  |                                |
| BookedCount          | INTEGER  | Default 0                      |
| MaxBookingPerCustomer| INTEGER  | Default 1                      |
| StartDate            | TEXT     | yyyy-MM-dd                     |
| EndDate              | TEXT     | yyyy-MM-dd                     |
| StartTime            | TEXT     | HH:mm                          |
| EndTime              | TEXT     | HH:mm                          |
| Status               | TEXT     | Active/Draft/Paused/Expired/Cancelled |
| CreatedAt            | DATETIME |                                |
| UpdatedAt            | DATETIME |                                |

### Slot
| Column      | Type     | Notes                              |
|-------------|----------|------------------------------------|
| Id          | INTEGER  | PK                                 |
| OfferId     | INTEGER  | FK → Offer, Cascade Delete         |
| SlotDate    | TEXT     | yyyy-MM-dd                         |
| StartTime   | TEXT     | HH:mm                              |
| EndTime     | TEXT     | HH:mm                              |
| Capacity    | INTEGER  |                                    |
| BookedCount | INTEGER  | Default 0                          |
| Status      | TEXT     | Available/Full/Closed/Expired/Cancelled |
| CreatedAt   | DATETIME |                                    |

### Booking
| Column           | Type     | Notes                          |
|------------------|----------|--------------------------------|
| Id               | INTEGER  | PK                             |
| BookingReference | TEXT     | Unique, e.g. SS-1234           |
| OfferId          | INTEGER  | FK → Offer, Restrict Delete    |
| SlotId           | INTEGER  | FK → Slot, Restrict Delete     |
| CustomerName     | TEXT     |                                |
| CustomerPhone    | TEXT     |                                |
| CustomerEmail    | TEXT     |                                |
| PeopleCount      | INTEGER  | Default 1                      |
| SpecialNote      | TEXT     |                                |
| Status           | TEXT     | Confirmed/Completed/Cancelled/NoShow/Pending |
| CreatedAt        | DATETIME |                                |