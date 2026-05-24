# ⚡ SmartSlot — Limited-Time Offer Booking Platform

SmartSlot is a full-stack web application that allows businesses to create limited-time offers with specific time slots, and customers to browse and book those slots instantly.

---

## 🚀 Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + TypeScript (Vite)      |
| Backend  | ASP.NET Core 10 (C#)              |
| Database | SQLite (via Entity Framework Core)|
| Auth     | JWT Bearer Tokens                 |
| API Docs | Swagger / Swashbuckle 10          |

---

## 📁 Project Structure

```
SmartSlot/
├── QuickSlot.API/          # ASP.NET Core backend
│   ├── Controllers/        # Auth, Business, Offers, Slots, Bookings, Dashboard
│   ├── Models/             # Offer, Slot, Booking, Business, User
│   ├── Data/               # AppDbContext (EF Core)
│   ├── Program.cs          # App startup, JWT, Swagger, CORS
│   └── appsettings.json    # Config (JWT, connection string)
└── src/                    # React frontend
    └── App.tsx             # Full single-file React app
```

---

## ⚙️ Setup Instructions

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [EF Core CLI](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)

```bash
dotnet tool install --global dotnet-ef
```

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/smartslot.git
cd smartslot
```

---

### 2. Backend setup

```bash
cd QuickSlot.API
```

Copy the environment file:
```bash
cp .env.example appsettings.json
```

Run migrations and start the API:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

API will start at: `http://localhost:5205`  
Swagger UI at: `http://localhost:5205/swagger`

---

### 3. Register the admin user

Open Swagger at `http://localhost:5205/swagger`  
Call `POST /api/auth/register`:

```json
{
  "email": "admin@smartslot.com",
  "passwordHash": "admin123",
  "name": "Admin"
}
```

---

### 4. Frontend setup

```bash
cd ../src   # or wherever your React project is
npm install
npm run dev
```

Frontend will start at: `http://localhost:5173`

---

### 5. Login

Open the app → Login with:
- **Email:** admin@smartslot.com  
- **Password:** admin123

---

## 🗺️ How to Use

1. **Admin Login** → Sign in at the login page
2. **Create Business** → Go to Businesses tab → Add a business (e.g. FitZone Gym, Glow Salon)
3. **Create Offer** → Go to Offers → Create Offer → Select business → Fill details
4. **Add Slots** → On the Offers table → click Slots → Add time slots (e.g. 10AM–11AM, cap 10)
5. **Public Booking** → Click "← Public Site" → Browse offers → Book Now → Fill form → Confirm
6. **Manage Bookings** → Go to Bookings tab → Update status (Confirmed / Completed / Cancelled)

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Login | Admin email + password login |
| Dashboard | Stats: offers, bookings, capacity, conversion rate |
| Businesses | Create and manage multiple business profiles |
| Create Offer | Full offer form with business selector |
| Manage Offers | Table with edit, slots, delete actions |
| Manage Bookings | All bookings with status management + CSV export |
| Public Listing | Customer-facing offer cards with filters + timer |
| Offer Detail | Full details + slot selector + booking form |
| Confirmation | Booking reference, slot details, total paid |

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register admin |
| POST | /api/auth/login | Login, returns JWT |
| GET/POST/PUT/DELETE | /api/business | Business CRUD |
| GET/POST/PUT/DELETE | /api/offers | Offer CRUD |
| GET | /api/offers/{id}/slots | Get slots for offer |
| GET/POST/PUT/DELETE | /api/slots | Slot CRUD |
| GET/POST | /api/bookings | Booking CRUD |
| PUT | /api/bookings/{id}/status | Update booking status |
| GET | /api/dashboard/summary | Dashboard stats |

---

## ✅ Features Implemented

- [x] Admin login with JWT authentication
- [x] Multiple business profiles (Gym, Salon, Spa, Restaurant, etc.)
- [x] Full offer management (create, edit, delete, status)
- [x] Slot management per offer (multiple slots with capacity)
- [x] Public offer listing with filters (type, category, date, price, availability)
- [x] Live countdown timer on offer cards
- [x] Customer booking flow with full validation
- [x] Booking confirmation with reference number
- [x] Admin booking status management
- [x] Dashboard with 8 stats + conversion rate
- [x] CSV export of bookings
- [x] Fallback demo data when backend is offline

---

## 👥 Team

- **Team leader Name:** Dhanushri J
- **Hackathon:** Willovate Talent Hunt  2026
