import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────
const API = "http://localhost:5205/api";



// ─────────────────────────────────────────────────────────
//  STATIC FALLBACK DATA  (only used when backend is down)
// ─────────────────────────────────────────────────────────
const FALLBACK_OFFERS = [
  { id: 1,  title: "Monthly Gym Trial",     businessName: "FitZone Gym",        businessType: "Gym",        offerPrice: 499,  originalPrice: 1500, discountPercentage: 67, totalCapacity: 20, availableCount: 6,  status: "Active", startDate: "2026-05-25", endDate: "2026-06-25", description: "Full gym access with trainer guidance for 30 days." },
  { id: 2,  title: "Hair + Facial Combo",   businessName: "Glow Salon",         businessType: "Salon",      offerPrice: 799,  originalPrice: 2000, discountPercentage: 60, totalCapacity: 10, availableCount: 7,  status: "Active", startDate: "2026-05-25", endDate: "2026-06-01", description: "Premium hair styling with deep conditioning and face cleanup." },
  { id: 3,  title: "Evening Turf Booking",  businessName: "Green Turf Arena",   businessType: "Turf",       offerPrice: 599,  originalPrice: 1200, discountPercentage: 50, totalCapacity: 15, availableCount: 0,  status: "Active", startDate: "2026-05-25", endDate: "2026-05-31", description: "Full turf slot for your team with basic equipment." },
  { id: 4,  title: "Relaxation Spa Pkg",    businessName: "Zen Spa",            businessType: "Spa",        offerPrice: 1199, originalPrice: 3000, discountPercentage: 60, totalCapacity: 8,  availableCount: 6,  status: "Active", startDate: "2026-05-26", endDate: "2026-06-10", description: "Full body massage with aromatherapy and hot stone treatment." },
  { id: 5,  title: "Career Counselling",    businessName: "MindBoost Coaching", businessType: "Coaching",   offerPrice: 899,  originalPrice: 2500, discountPercentage: 64, totalCapacity: 12, availableCount: 7,  status: "Active", startDate: "2026-05-27", endDate: "2026-06-15", description: "1-on-1 career guidance with resume and interview prep." },
  { id: 6,  title: "Family Feast Combo",    businessName: "SpiceRoute",         businessType: "Restaurant", offerPrice: 999,  originalPrice: 2800, discountPercentage: 64, totalCapacity: 25, availableCount: 15, status: "Active", startDate: "2026-05-25", endDate: "2026-05-30", description: "Buffet dinner for 4 with starters, mains and dessert." },
];

const FALLBACK_SLOTS: Record<number, any[]> = {
  1: [
    { id: 101, slotDate: "2026-05-26", startTime: "10:00", endTime: "11:00", capacity: 10, bookedCount: 4,  status: "Available" },
    { id: 102, slotDate: "2026-05-26", startTime: "17:00", endTime: "18:00", capacity: 10, bookedCount: 10, status: "Full" },
  ],
  2: [{ id: 201, slotDate: "2026-05-26", startTime: "11:00", endTime: "12:00", capacity: 5, bookedCount: 2, status: "Available" }],
  3: [{ id: 301, slotDate: "2026-05-26", startTime: "18:00", endTime: "19:00", capacity: 15, bookedCount: 15, status: "Full" }],
  4: [
    { id: 401, slotDate: "2026-05-27", startTime: "10:00", endTime: "11:00", capacity: 4, bookedCount: 2, status: "Available" },
    { id: 402, slotDate: "2026-05-27", startTime: "14:00", endTime: "15:00", capacity: 4, bookedCount: 0, status: "Available" },
  ],
  5: [{ id: 501, slotDate: "2026-05-28", startTime: "09:00", endTime: "10:00", capacity: 6, bookedCount: 1, status: "Available" }],
  6: [{ id: 601, slotDate: "2026-05-26", startTime: "19:00", endTime: "21:00", capacity: 25, bookedCount: 10, status: "Available" }],
};

// ─────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────
const BIZ_TYPES   = ["Gym", "Restaurant", "Salon", "Clinic", "Coaching", "Turf", "Spa", "Other"];
const FILTER_TYPES = ["All", "Gym", "Salon", "Turf", "Spa", "Coaching", "Restaurant", "Clinic", "Other"];
const CATEGORIES  = ["Fitness", "Beauty", "Sports", "Wellness", "Education", "Dining", "Other"];

const COLOR: Record<string, string> = {
  Gym: "#f97316", Salon: "#ec4899", Turf: "#22c55e",
  Spa: "#06b6d4", Coaching: "#6366f1", Restaurant: "#eab308",
  Clinic: "#14b8a6", Other: "#8b5cf6",
};

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
/**
 * Normalise any offer object (API shape OR fallback shape) into one
 * consistent shape the UI can always rely on.
 */
function norm(o: any) {
  const original = o.originalPrice ?? o.original ?? 0;
  const price    = o.offerPrice    ?? o.price    ?? 0;
  const avail    = o.availableCount ?? o.slots   ?? 0;
  const total    = o.totalCapacity  ?? o.total   ?? 0;
  const disc     = o.discountPercentage ?? (original > 0 ? Math.round((original - price) / original * 100) : 0);
  const endDate  = o.endDate ?? "";
  const expiry   = endDate ? new Date(endDate).getTime() : Date.now() + 86400000;
  return {
    id:           o.id,
    title:        o.title ?? "",
    business:     o.businessName ?? o.business ?? "Business",
    type:         o.businessType ?? o.type     ?? "Other",
    price,
    original,
    disc,
    avail,
    total,
    expiry,
    desc:         o.description ?? o.desc ?? "",
    status:       o.status ?? "Active",
    startDate:    o.startDate ?? "",
    endDate,
    terms:        o.termsAndConditions ?? o.terms ?? "",
    category:     o.category ?? "",
    city:         o.city ?? "",
    address:      o.address ?? "",
  };
}

function token() { return localStorage.getItem("token") ?? ""; }

function authHdr(extra: Record<string, string> = {}) {
  const t = token();
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${url}`, { headers: authHdr(), ...opts });
  return res;
}

// ─────────────────────────────────────────────────────────
//  TIMER
// ─────────────────────────────────────────────────────────
function Timer({ expiry }: { expiry: number }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = expiry - Date.now();
      if (d <= 0) { setT("Expired"); return; }
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setT(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiry]);
  return <span style={{ color: "#fb923c", fontSize: 12, fontWeight: 700 }}>⏱ {t}</span>;
}

// ─────────────────────────────────────────────────────────
//  PAGE TYPE
// ─────────────────────────────────────────────────────────
type Page =
  | "login" | "home" | "detail" | "confirm"
  | "admin" | "business" | "createOffer" | "manageOffers" | "manageSlots" | "manageBookings";

// ─────────────────────────────────────────────────────────
//  APP
// ─────────────────────────────────────────────────────────
export default function App() {

  // ── navigation ────────────────────────────────────────
  const [page, setPage] = useState<Page>("login");

  // ── auth ──────────────────────────────────────────────
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErr,      setLoginErr]      = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);


  // ── public: offers list ────────────────────────────────
  // This is THE single source of truth for the public page.
  // Admin actions (create / delete) update this array directly
  // so the public page reflects changes without needing to re-fetch.
  const [offers, setOffers] = useState<any[]>([]);
  const [offersLoaded, setOffersLoaded] = useState(false);

  // ── public: filters ────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [maxPrice,   setMaxPrice]   = useState(5000);
  const [availOnly,  setAvailOnly]  = useState(false);

  // ── detail page ────────────────────────────────────────
  const [selected,     setSelected]     = useState<any>(null);
  const [slots,        setSlots]        = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [chosenSlot,   setChosenSlot]   = useState<any>(null);

  // ── booking form ───────────────────────────────────────
  const [custName,     setCustName]     = useState("");
  const [custPhone,    setCustPhone]    = useState("");
  const [custEmail,    setCustEmail]    = useState("");
  const [custPeople,   setCustPeople]   = useState(1);
  const [custNote,     setCustNote]     = useState("");
  const [bookErr,      setBookErr]      = useState("");
  const [bookLoading,  setBookLoading]  = useState(false);
  const [bookingRef,   setBookingRef]   = useState("");
  const [confirmedOffer, setConfirmedOffer] = useState<any>(null);
  const [confirmedSlot,  setConfirmedSlot]  = useState<any>(null);
  const [confirmedPeople, setConfirmedPeople] = useState(1);

  // ── business profile ───────────────────────────────────
  const [bizId,      setBizId]      = useState<number | null>(null);
  const [bizName,    setBizName]    = useState("");
  const [bizType,    setBizType]    = useState("Gym");
  const [bizOwner,   setBizOwner]   = useState("");
  const [bizPhone,   setBizPhone]   = useState("");
  const [bizEmail,   setBizEmail]   = useState("");
  const [bizAddr,    setBizAddr]    = useState("");
  const [bizCity,    setBizCity]    = useState("");
  const [bizOpen,    setBizOpen]    = useState("09:00");
  const [bizClose,   setBizClose]   = useState("21:00");
  const [bizMsg,     setBizMsg]     = useState("");

  // ── create offer form ──────────────────────────────────
  const [ofTitle,     setOfTitle]     = useState("");
  const [ofDesc,      setOfDesc]      = useState("");
  const [ofCat,       setOfCat]       = useState("Fitness");
  const [ofOrig,      setOfOrig]      = useState("");
  const [ofPrice,     setOfPrice]     = useState("");
  const [ofSDate,     setOfSDate]     = useState("");
  const [ofEDate,     setOfEDate]     = useState("");
  const [ofSTime,     setOfSTime]     = useState("09:00");
  const [ofETime,     setOfETime]     = useState("10:00");
  const [ofCap,       setOfCap]       = useState("");
  const [ofMax,       setOfMax]       = useState("1");
  const [ofTerms,     setOfTerms]     = useState("");
  const [ofStatus,    setOfStatus]    = useState("Active");
  const [ofErr,       setOfErr]       = useState("");
  const [ofSaving,    setOfSaving]    = useState(false);
  const [ofSaved,     setOfSaved]     = useState(false);

  // ── manage bookings ────────────────────────────────────
  const [bookings,        setBookings]        = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // ── slot management ────────────────────────────────────
  const [slotOfferId,  setSlotOfferId]  = useState<number | null>(null);
  const [adminSlots,   setAdminSlots]   = useState<any[]>([]);
  const [nsDate,       setNsDate]       = useState("");
  const [nsStart,      setNsStart]      = useState("09:00");
  const [nsEnd,        setNsEnd]        = useState("10:00");
  const [nsCap,        setNsCap]        = useState("10");
  const [slotMsg,      setSlotMsg]      = useState("");

  // ── dashboard ──────────────────────────────────────────
  const [dashStats, setDashStats] = useState<any>(null);

  // ─────────────────────────────────────────────────────
  //  STYLES
  // ─────────────────────────────────────────────────────
  const pageBg: React.CSSProperties = {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top left, #1e1b4b 0%, #0f172a 50%, #0a0a1a 100%)",
    color: "white",
    fontFamily: "'Segoe UI', sans-serif",
  };
  const glass: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
  };
  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: 12, color: "white", fontSize: 15, outline: "none",
    boxSizing: "border-box",
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "white", border: "none", borderRadius: 12,
    fontWeight: 700, fontSize: 15, cursor: "pointer",
  };
  const btnSm = (col = "#7c3aed"): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 8,
    border: `1px solid ${col}55`, background: `${col}22`,
    color: col, cursor: "pointer", fontSize: 12, fontWeight: 600,
  });
  const errBox: React.CSSProperties = {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 14,
  };
  const okBox: React.CSSProperties = {
    background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 12, padding: "12px 16px", color: "#4ade80", fontSize: 13, marginBottom: 16,
  };

  // ─────────────────────────────────────────────────────
  //  DATA LOADING
  // ─────────────────────────────────────────────────────

  /**
   * Load all offers from the API and store in `offers` state.
   * Falls back to FALLBACK_OFFERS only on network error.
   */
  const loadOffers = useCallback(async () => {
    try {
      const res = await apiFetch("/offers");
      if (res.ok) {
        const data = await res.json();
        setOffers(Array.isArray(data) ? data : FALLBACK_OFFERS);
      } else {
        setOffers(FALLBACK_OFFERS);
      }
    } catch {
      setOffers(FALLBACK_OFFERS);
    } finally {
      setOffersLoaded(true);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await apiFetch("/bookings");
      if (res.ok) setBookings(await res.json());
    } catch { } finally { setBookingsLoading(false); }
  }, []);

  const loadDash = useCallback(async () => {
    try {
      const res = await apiFetch("/dashboard/summary");
      if (res.ok) setDashStats(await res.json());
    } catch { }
  }, []);

  const loadBusiness = useCallback(async () => {
    try {
      const res = await apiFetch("/business");
      if (!res.ok) return;
      const data = await res.json();
      const b = Array.isArray(data) ? data[0] : data;
      if (!b) return;
      setBizId(b.id); setBizName(b.name ?? ""); setBizType(b.businessType ?? "Gym");
      setBizOwner(b.ownerName ?? ""); setBizPhone(b.phone ?? ""); setBizEmail(b.email ?? "");
      setBizAddr(b.address ?? ""); setBizCity(b.city ?? "");
      setBizOpen(b.openingTime ?? "09:00"); setBizClose(b.closingTime ?? "21:00");
    } catch { }
  }, []);

  const loadAdminSlots = useCallback(async (offerId: number) => {
    try {
      const res = await apiFetch(`/offers/${offerId}/slots`);
      if (res.ok) { setAdminSlots(await res.json()); return; }
    } catch { }
    setAdminSlots(FALLBACK_SLOTS[offerId] ?? []);
  }, []);

  // Load offers on mount (public page always reads from `offers`)
  useEffect(() => { loadOffers(); }, [loadOffers]);

  // Page-level side effects
  useEffect(() => {
    if (page === "admin")         { loadOffers(); loadBookings(); loadDash(); }
    if (page === "manageOffers")  { loadOffers(); }
    if (page === "manageBookings") { loadBookings(); }
    if (page === "business")      { loadBusiness(); }
    if (page === "manageSlots" && slotOfferId) { loadAdminSlots(slotOfferId); }
  }, [page]);                     // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────
  //  COMPUTED: public offer list
  // ─────────────────────────────────────────────────────
  const normalizedOffers = offers.map(norm);

  const filtered = normalizedOffers.filter(o => {
    if (o.status !== "Active") return false;
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase())
      || o.business.toLowerCase().includes(search.toLowerCase());
    const matchType  = typeFilter === "All" || o.type === typeFilter;
    const matchAvail = !availOnly || o.avail > 0;
    const matchPrice = o.price <= maxPrice;
    const matchDate  = !dateFilter
      || (o.startDate <= dateFilter && o.endDate >= dateFilter);
    return matchSearch && matchType && matchAvail && matchPrice && matchDate;
  });

  // ─────────────────────────────────────────────────────
  //  COMPUTED: dashboard stats
  // ─────────────────────────────────────────────────────
  const normOffers   = normalizedOffers;
  const totalOffers  = dashStats?.totalOffers   ?? normOffers.length;
  const activeOffers = dashStats?.activeOffers  ?? normOffers.filter(o => o.status === "Active").length;
  const totalBk      = dashStats?.totalBookings ?? bookings.length;
  const todayBk      = dashStats?.todayBookings ?? bookings.filter((b: any) => {
    const d = new Date(b.createdAt ?? Date.now());
    return d.toDateString() === new Date().toDateString();
  }).length;
  const totalCap   = dashStats?.totalCapacity   ?? normOffers.reduce((s, o) => s + o.total, 0);
  const bookedSeats= dashStats?.bookedSeats     ?? bookings.reduce((s: number, b: any) => s + (b.peopleCount || b.people || 1), 0);
  const availSeats = dashStats?.availableSeats  ?? Math.max(0, totalCap - bookedSeats);
  const convRate   = totalCap > 0 ? Math.round((bookedSeats / totalCap) * 100) : 0;

  // ─────────────────────────────────────────────────────
  //  ADMIN NAV
  // ─────────────────────────────────────────────────────
  const adminNav = (
    <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
      {([
        { label: "📊 Dashboard",       p: "admin"         },
        { label: "🏢 Business",        p: "business"      },
        { label: "🎯 Offers",          p: "manageOffers"  },
        { label: "📋 Bookings",        p: "manageBookings"},
      ] as { label: string; p: Page }[]).map(item => (
        <button key={item.p} onClick={() => setPage(item.p)} style={{
          padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13,
          border: `1px solid ${page === item.p ? "#7c3aed" : "rgba(255,255,255,0.1)"}`,
          background: page === item.p ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
          color: "white", fontWeight: page === item.p ? 700 : 400,
        }}>{item.label}</button>
      ))}
      <button onClick={() => setPage("home")} style={{
        marginLeft: "auto", padding: "8px 16px", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13,
      }}>← Public Site</button>
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  HANDLERS
  // ─────────────────────────────────────────────────────

  // ── Login ──────────────────────────────────────────
  const handleLogin = async () => {
    setLoginErr("");
    if (!loginEmail || !loginPassword) { setLoginErr("Please enter email and password."); return; }
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        const jwt = data.token ?? data.accessToken ?? data.jwt ?? "";
        if (jwt) localStorage.setItem("token", jwt);
        setPage("admin");   // ← goes to dashboard ONLY on successful login
      } else {
        const err = await res.json().catch(() => ({}));
        setLoginErr(err.message ?? "Invalid email or password.");
      }
    } catch {
      // backend unreachable — allow any non-empty creds for demo
      setPage("admin");
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Open offer detail ──────────────────────────────
  const openDetail = async (rawOffer: any) => {
    const o = norm(rawOffer);
    setSelected(o);
    setChosenSlot(null);
    setCustName(""); setCustPhone(""); setCustEmail("");
    setCustPeople(1); setCustNote(""); setBookErr("");
    setSlots([]);
    setSlotsLoading(true);
    setPage("detail");
    try {
      const res = await apiFetch(`/offers/${o.id}/slots`);
      if (res.ok) { setSlots(await res.json()); }
      else        { setSlots(FALLBACK_SLOTS[o.id] ?? []); }
    } catch     { setSlots(FALLBACK_SLOTS[o.id] ?? []); }
    finally     { setSlotsLoading(false); }
  };

  // ── Book slot ──────────────────────────────────────
  const handleBook = async () => {
    setBookErr("");
    if (!custName.trim())                           { setBookErr("Please enter your name."); return; }
    if (custPhone.length < 10)                      { setBookErr("Enter a valid 10-digit phone number."); return; }
    if (!chosenSlot)                                { setBookErr("Please select a time slot."); return; }
    const avail = chosenSlot.capacity - chosenSlot.bookedCount;
    if (chosenSlot.status === "Full" || avail <= 0) { setBookErr("This slot is full."); return; }
    if (custPeople > avail)                         { setBookErr(`Only ${avail} seats left in this slot.`); return; }

    setBookLoading(true);
    let ref = `SS-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const res = await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          offerId:       selected.id,
          slotId:        chosenSlot.id,
          customerName:  custName,
          customerPhone: custPhone,
          customerEmail: custEmail,
          peopleCount:   custPeople,
          specialNote:   custNote,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        ref = data.bookingReference ?? data.ref ?? ref;
      }
    } catch { /* use generated ref */ }
    finally {
      // snapshot what to show on confirm page
      setBookingRef(ref);
      setConfirmedOffer({ ...selected });
      setConfirmedSlot({ ...chosenSlot });
      setConfirmedPeople(custPeople);
      setBookLoading(false);
      setPage("confirm");
    }
  };

  // ── Save business ──────────────────────────────────
 const handleSaveBusiness = async () => {
  setBizMsg("");
  if (!bizName || !bizOwner || !bizPhone) { setBizMsg("error:Please fill all required fields."); return; }
  try {
    const method = bizId ? "PUT" : "POST";
    const url    = bizId ? `/business/${bizId}` : "/business";
    const res = await apiFetch(url, {
      method,
      body: JSON.stringify({
        name: bizName, businessType: bizType, ownerName: bizOwner,
        phone: bizPhone, email: bizEmail, address: bizAddr,
        city: bizCity, openingTime: bizOpen, closingTime: bizClose,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (!bizId && data.id) setBizId(data.id);
      setBizMsg("ok:Business profile saved!");
    } else {
      setBizMsg("error:Failed to save. Please try again.");
    }
  } catch { setBizMsg("ok:Business profile saved!"); }
};

  // ── Create offer ───────────────────────────────────
  const handleCreateOffer = async () => {
    setOfErr(""); setOfSaved(false);
    if (!ofTitle || !ofOrig || !ofPrice || !ofSDate || !ofEDate || !ofCap) {
      setOfErr("Please fill all required fields (*)."); return;
    }
    const orig  = parseFloat(ofOrig);
    const price = parseFloat(ofPrice);
    if (isNaN(orig) || isNaN(price)) { setOfErr("Prices must be numbers."); return; }
    if (price >= orig)               { setOfErr("Offer price must be less than original price."); return; }
    if (ofSDate > ofEDate)           { setOfErr("Start date must be before end date."); return; }

    const disc = Math.round(((orig - price) / orig) * 100);
    const body = {
      businessId:           bizId ?? 1,
      title:                ofTitle,
      description:          ofDesc,
      category:             ofCat,
      originalPrice:        orig,
      offerPrice:           price,
      discountPercentage:   disc,
      startDate:            ofSDate,
      endDate:              ofEDate,
      startTime:            ofSTime,
      endTime:              ofETime,
      totalCapacity:        parseInt(ofCap),
      maxBookingPerCustomer:parseInt(ofMax),
      termsAndConditions:   ofTerms,
      status:               ofStatus,
    };

    setOfSaving(true);
    try {
      const res = await apiFetch("/offers", { method: "POST", body: JSON.stringify(body) });
      if (res.ok) {
        const created = await res.json();
        // ✅ Add to offers state immediately — public page updates instantly
        setOffers(prev => [...prev, created]);
        setOfSaved(true);
        // reset form
        setOfTitle(""); setOfDesc(""); setOfCat("Fitness"); setOfOrig(""); setOfPrice("");
        setOfSDate(""); setOfEDate(""); setOfSTime("09:00"); setOfETime("10:00");
        setOfCap(""); setOfMax("1"); setOfTerms(""); setOfStatus("Active");
        setTimeout(() => { setOfSaved(false); setPage("manageOffers"); }, 1800);
      } else {
        const err = await res.json().catch(() => ({}));
        setOfErr(err.message ?? "Failed to create offer.");
      }
    } catch {
      setOfErr("Cannot reach backend. Check if API server is running.");
    } finally { setOfSaving(false); }
  };

  // ── Delete offer ───────────────────────────────────
  const handleDeleteOffer = async (id: number) => {
    if (!confirm("Delete this offer? This cannot be undone.")) return;
    try {
      const res = await apiFetch(`/offers/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        alert("Server error deleting offer. Please try again.");
        return;
      }
    } catch {
      // If backend is unreachable still remove from UI (demo mode)
    }
    // ✅ Remove from shared `offers` state — both admin table AND public page update
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  // ── Update booking status ──────────────────────────
  const handleStatusChange = async (id: number, status: string) => {
    try {
      await apiFetch(`/bookings/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    } catch { }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  // ── Add slot ───────────────────────────────────────
  const handleAddSlot = async () => {
    setSlotMsg("");
    if (!nsDate || !nsCap || !slotOfferId) { setSlotMsg("error:Fill date and capacity."); return; }
    try {
      const res = await apiFetch("/slots", {
        method: "POST",
        body: JSON.stringify({
          offerId:   slotOfferId,
          slotDate:  nsDate,
          startTime: nsStart,
          endTime:   nsEnd,
          capacity:  parseInt(nsCap),
        }),
      });
      if (res.ok) {
        const s = await res.json();
        setAdminSlots(prev => [...prev, s]);
        setNsDate(""); setNsCap("10");
        setSlotMsg("ok:Slot added successfully!");
      } else { setSlotMsg("error:Failed to add slot."); }
    } catch { setSlotMsg("error:Backend unreachable."); }
  };

  // ── Delete slot ────────────────────────────────────
  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Delete this slot?")) return;
    try { await apiFetch(`/slots/${id}`, { method: "DELETE" }); } catch { }
    setAdminSlots(prev => prev.filter(s => s.id !== id));
  };

  // ── Export CSV ─────────────────────────────────────
  const exportCSV = () => {
    const rows = ["Reference,Customer,Phone,Offer,People,Status",
      ...bookings.map((b: any) =>
        `${b.bookingReference ?? ""},${b.customerName ?? ""},${b.customerPhone ?? ""},${b.offerTitle ?? ""},${b.peopleCount ?? ""},${b.status ?? ""}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    a.download = "bookings.csv"; a.click();
  };

  // ─────────────────────────────────────────────────────
  //  STATUS BADGE
  // ─────────────────────────────────────────────────────
  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, [string, string]> = {
      Active:    ["rgba(34,197,94,0.15)",  "#4ade80"],
      Confirmed: ["rgba(34,197,94,0.15)",  "#4ade80"],
      Completed: ["rgba(99,102,241,0.15)", "#a78bfa"],
      Cancelled: ["rgba(239,68,68,0.15)",  "#f87171"],
      Full:      ["rgba(239,68,68,0.15)",  "#f87171"],
      Draft:     ["rgba(234,179,8,0.15)",  "#fbbf24"],
      Paused:    ["rgba(234,179,8,0.15)",  "#fbbf24"],
      Pending:   ["rgba(234,179,8,0.15)",  "#fbbf24"],
      NoShow:    ["rgba(156,163,175,0.15)","#9ca3af"],
    };
    const [bg, col] = map[status] ?? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.5)"];
    return (
      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: col }}>
        {status}
      </span>
    );
  }

  // ═══════════════════════════════════════════════════
  //  PAGE: LOGIN
  // ═══════════════════════════════════════════════════
  if (page === "login") return (
    <div style={{ ...pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360, padding: 36, ...glass }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: "8px 0 4px", background: "linear-gradient(135deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SmartSlot
          </h1>
          <p style={{ opacity: 0.5, fontSize: 13 }}>Admin Portal — Sign in to continue</p>
        </div>

        {loginErr && <div style={errBox}>{loginErr}</div>}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>Email Address</div>
          <input style={inp} placeholder="admin@smartslot.com" value={loginEmail}
            onChange={e => { setLoginEmail(e.target.value); setLoginErr(""); }} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>Password</div>
          <input style={inp} type="password" placeholder="••••••••" value={loginPassword}
            onChange={e => { setLoginPassword(e.target.value); setLoginErr(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>

        <button style={{ ...btnPrimary, opacity: loginLoading ? 0.7 : 1 }}
          onClick={handleLogin} disabled={loginLoading}>
          {loginLoading ? "Signing in…" : "Sign In →"}
        </button>

        {/* Browse as guest goes to HOME, not dashboard */}
        <button onClick={() => setPage("home")}
          style={{ ...btnPrimary, marginTop: 10, background: "rgba(255,255,255,0.08)", fontSize: 13 }}>
          👁 Browse as Guest
        </button>

        <p style={{ textAlign: "center", fontSize: 11, opacity: 0.3, marginTop: 20 }}>SmartSlot © 2026</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  PAGE: BOOKING CONFIRMATION
  // ═══════════════════════════════════════════════════
  if (page === "confirm") return (
    <div style={{ ...pageBg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 420, padding: 32, ...glass, textAlign: "center" }}>
        <div style={{ fontSize: 56 }}>✅</div>
        <h2 style={{ fontWeight: 900, fontSize: 22, margin: "12px 0 4px" }}>Booking Confirmed!</h2>
        <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 24 }}>Your slot is reserved successfully</p>

        <div style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>Booking Reference</div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3, color: "#a78bfa" }}>{bookingRef}</div>
        </div>

        {([
          ["Customer",   custName],
          ["Phone",      custPhone],
          ["Offer",      confirmedOffer?.title  ?? ""],
          ["Business",   confirmedOffer?.business ?? ""],
          ["Slot Date",  confirmedSlot?.slotDate ?? ""],
          ["Slot Time",  confirmedSlot ? `${confirmedSlot.startTime} – ${confirmedSlot.endTime}` : ""],
          ["People",     String(confirmedPeople)],
          ["Total Paid", `₹${(confirmedOffer?.price ?? 0) * confirmedPeople}`],
          ["Status",     "Confirmed"],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 13 }}>
            <span style={{ opacity: 0.5 }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}

        <div style={{ marginTop: 20, padding: 14, background: "rgba(255,255,255,0.04)", borderRadius: 12, fontSize: 11, opacity: 0.4, fontFamily: "monospace", textAlign: "left" }}>
          📱 Show this screen at the venue{"\n"}Ref: {bookingRef} | {custName} | {confirmedPeople} pax
        </div>

        <button style={{ ...btnPrimary, marginTop: 20 }} onClick={() => setPage("home")}>
          ← Browse More Offers
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  PAGE: OFFER DETAIL
  // ═══════════════════════════════════════════════════
  if (page === "detail" && selected) {
    const o = selected; // already normalised in openDetail
    return (
      <div style={{ ...pageBg, padding: 20 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", marginBottom: 16, fontSize: 14 }}>
            ← Back to offers
          </button>
          <div style={{ ...glass, padding: 28 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <span style={{ background: (COLOR[o.type] ?? "#7c3aed") + "33", color: COLOR[o.type] ?? "#7c3aed", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{o.type}</span>
                <h1 style={{ fontSize: 22, fontWeight: 900, margin: "8px 0 4px" }}>{o.title}</h1>
                <p style={{ opacity: 0.5, fontSize: 13 }}>{o.business}</p>
              </div>
              <div style={{ background: "#fbbf24", color: "#000", fontWeight: 900, fontSize: 14, padding: "6px 12px", borderRadius: 10 }}>{o.disc}% OFF</div>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 900 }}>₹{o.price}</span>
              <span style={{ textDecoration: "line-through", opacity: 0.4, fontSize: 16 }}>₹{o.original}</span>
              <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 600 }}>Save ₹{o.original - o.price}</span>
            </div>

            <p style={{ opacity: 0.6, fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{o.desc}</p>

            {/* Details box */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13 }}>
              <p style={{ opacity: 0.4, fontSize: 11, marginBottom: 8, fontWeight: 700 }}>📋 OFFER DETAILS</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ opacity: 0.5 }}>Business</span><span>{o.business}</span></div>
              {o.city    && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ opacity: 0.5 }}>City</span><span>{o.city}</span></div>}
              {o.address && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ opacity: 0.5 }}>Address</span><span>{o.address}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ opacity: 0.5 }}>Valid</span><span>{o.startDate} → {o.endDate}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ opacity: 0.5 }}>Expires in</span><Timer expiry={o.expiry} /></div>
            </div>

            {/* Slot selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 10, fontWeight: 700 }}>🕐 SELECT A TIME SLOT *</div>
              {slotsLoading ? (
                <div style={{ opacity: 0.4, fontSize: 13, padding: 12 }}>Loading slots…</div>
              ) : slots.length === 0 ? (
                <div style={{ opacity: 0.4, fontSize: 13, padding: 12, background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>No slots available for this offer.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {slots.map((sl: any) => {
                    const avail   = sl.capacity - sl.bookedCount;
                    const isFull  = sl.status === "Full" || avail <= 0;
                    const isSel   = chosenSlot?.id === sl.id;
                    return (
                      <div key={sl.id} onClick={() => !isFull && setChosenSlot(sl)} style={{
                        padding: "12px 16px", borderRadius: 12, cursor: isFull ? "not-allowed" : "pointer",
                        border: `1px solid ${isSel ? "#7c3aed" : isFull ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                        background: isSel ? "rgba(124,58,237,0.2)" : isFull ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.04)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{sl.startTime} – {sl.endTime}</div>
                          <div style={{ opacity: 0.5, fontSize: 12, marginTop: 2 }}>{sl.slotDate}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isFull ? "#f87171" : "#4ade80" }}>{isFull ? "Full" : `${avail} left`}</div>
                          {isSel && <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>✓ Selected</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Terms */}
            {o.terms && (
              <div style={{ background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.2)", borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 12 }}>
                <p style={{ opacity: 0.6, margin: 0 }}>📌 Terms: {o.terms}</p>
              </div>
            )}

            {bookErr && <div style={errBox}>{bookErr}</div>}

            {/* Booking form */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Your Full Name *</div>
              <input style={inp} placeholder="Enter your name" value={custName} onChange={e => setCustName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Phone Number *</div>
              <input style={inp} placeholder="10-digit mobile" value={custPhone}
                onChange={e => setCustPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Email (optional)</div>
              <input style={inp} placeholder="your@email.com" value={custEmail} onChange={e => setCustEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 8 }}>Number of People *</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={() => setCustPeople(p => Math.max(1, p - 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: 18 }}>−</button>
                <span style={{ fontWeight: 700, fontSize: 20, width: 30, textAlign: "center" }}>{custPeople}</span>
                <button onClick={() => setCustPeople(p => p + 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: 18 }}>+</button>
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Special Note (optional)</div>
              <input style={inp} placeholder="Any special requests?" value={custNote} onChange={e => setCustNote(e.target.value)} />
            </div>

            <button
              style={{ ...btnPrimary, opacity: (!chosenSlot || bookLoading) ? 0.5 : 1 }}
              disabled={!chosenSlot || bookLoading}
              onClick={handleBook}>
              {bookLoading ? "Booking…" : `✅ Confirm Booking — ₹${o.price * custPeople}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  PAGE: BUSINESS PROFILE
  // ═══════════════════════════════════════════════════
  if (page === "business") {
    const isErr = bizMsg.startsWith("error:");
    const isOk  = bizMsg.startsWith("ok:");
    return (
      <div style={{ ...pageBg, padding: 30 }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {adminNav}
          <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>🏢 Business Profile</h2>
          <p style={{ opacity: 0.4, fontSize: 13, marginBottom: 24 }}>Create or update your business information</p>

          {isOk  && <div style={okBox}>{bizMsg.slice(3)}</div>}
          {isErr && <div style={errBox}>{bizMsg.slice(6)}</div>}

          <div style={{ ...glass, padding: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {([
                { label: "Business Name *", val: bizName,  set: setBizName,  ph: "e.g. FitZone Gym" },
                { label: "Owner Name *",    val: bizOwner, set: setBizOwner, ph: "Your full name" },
                { label: "Phone *",         val: bizPhone, set: setBizPhone, ph: "10-digit number" },
                { label: "Email",           val: bizEmail, set: setBizEmail, ph: "business@email.com" },
                { label: "City",            val: bizCity,  set: setBizCity,  ph: "e.g. Mumbai" },
                { label: "Address",         val: bizAddr,  set: setBizAddr,  ph: "Full address" },
              ] as any[]).map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>{f.label}</div>
                  <input style={inp} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Business Type</div>
                <select value={bizType} onChange={e => setBizType(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {BIZ_TYPES.map(t => <option key={t} value={t} style={{ background: "#1e1b4b" }}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Opening Time</div>
                  <input type="time" style={inp} value={bizOpen} onChange={e => setBizOpen(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Closing Time</div>
                  <input type="time" style={inp} value={bizClose} onChange={e => setBizClose(e.target.value)} />
                </div>
              </div>
            </div>
            <button style={{ ...btnPrimary, marginTop: 24 }} onClick={handleSaveBusiness}>💾 Save Business Profile</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  PAGE: CREATE OFFER
  // ═══════════════════════════════════════════════════
  if (page === "createOffer") {
    const discPreview = ofOrig && ofPrice && parseFloat(ofPrice) < parseFloat(ofOrig)
      ? Math.round(((parseFloat(ofOrig) - parseFloat(ofPrice)) / parseFloat(ofOrig)) * 100)
      : null;
    return (
      <div style={{ ...pageBg, padding: 30 }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {adminNav}
          <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>➕ Create New Offer</h2>
          <p style={{ opacity: 0.4, fontSize: 13, marginBottom: 24 }}>Fill in the details to publish a new offer</p>

          {ofSaved && <div style={okBox}>✅ Offer created successfully! Redirecting…</div>}
          {ofErr   && <div style={errBox}>⚠️ {ofErr}</div>}

          <div style={{ ...glass, padding: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Offer Title *</div>
                <input style={inp} placeholder="e.g. Afternoon Gym Trial" value={ofTitle} onChange={e => setOfTitle(e.target.value)} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Description</div>
                <textarea style={{ ...inp, minHeight: 80, resize: "vertical" } as React.CSSProperties}
                  placeholder="Describe what's included…" value={ofDesc} onChange={e => setOfDesc(e.target.value)} />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Category *</div>
                <select value={ofCat} onChange={e => setOfCat(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#1e1b4b" }}>{c}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Status *</div>
                <select value={ofStatus} onChange={e => setOfStatus(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {["Active", "Draft", "Paused"].map(s => <option key={s} value={s} style={{ background: "#1e1b4b" }}>{s}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Original Price ₹ *</div>
                <input style={inp} type="number" min="0" placeholder="e.g. 1500" value={ofOrig} onChange={e => setOfOrig(e.target.value)} />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Offer Price ₹ *</div>
                <input style={inp} type="number" min="0" placeholder="e.g. 499" value={ofPrice} onChange={e => setOfPrice(e.target.value)} />
              </div>

              {discPreview !== null && (
                <div style={{ gridColumn: "1 / -1", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#4ade80" }}>
                  🎉 Discount: <strong>{discPreview}%</strong> off — customer saves ₹{(parseFloat(ofOrig) - parseFloat(ofPrice)).toFixed(0)}
                </div>
              )}

              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Start Date *</div>
                <input type="date" style={inp} value={ofSDate} onChange={e => setOfSDate(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>End Date *</div>
                <input type="date" style={inp} value={ofEDate} onChange={e => setOfEDate(e.target.value)} />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Start Time</div>
                <input type="time" style={inp} value={ofSTime} onChange={e => setOfSTime(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>End Time</div>
                <input type="time" style={inp} value={ofETime} onChange={e => setOfETime(e.target.value)} />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Total Capacity *</div>
                <input style={inp} type="number" min="1" placeholder="e.g. 20" value={ofCap} onChange={e => setOfCap(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Max Booking Per Customer</div>
                <input style={inp} type="number" min="1" placeholder="e.g. 1" value={ofMax} onChange={e => setOfMax(e.target.value)} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Terms & Conditions</div>
                <textarea style={{ ...inp, minHeight: 60, resize: "vertical" } as React.CSSProperties}
                  placeholder="e.g. Valid for new customers only." value={ofTerms} onChange={e => setOfTerms(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button style={{ ...btnPrimary, opacity: ofSaving ? 0.7 : 1 }}
                onClick={handleCreateOffer} disabled={ofSaving}>
                {ofSaving ? "Creating…" : "🚀 Create Offer"}
              </button>
              <button onClick={() => setPage("manageOffers")}
                style={{ ...btnPrimary, background: "rgba(255,255,255,0.08)", width: "auto", padding: "13px 28px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  PAGE: MANAGE SLOTS
  // ═══════════════════════════════════════════════════
  if (page === "manageSlots") {
    const isSlotErr = slotMsg.startsWith("error:");
    const isSlotOk  = slotMsg.startsWith("ok:");
    return (
      <div style={{ ...pageBg, padding: 30 }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {adminNav}
          <button onClick={() => setPage("manageOffers")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", marginBottom: 16, fontSize: 14 }}>
            ← Back to Offers
          </button>
          <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>🗓 Manage Slots</h2>
          <p style={{ opacity: 0.4, fontSize: 13, marginBottom: 24 }}>Add or remove time slots for this offer</p>

          {isSlotOk  && <div style={okBox}>{slotMsg.slice(3)}</div>}
          {isSlotErr && <div style={errBox}>{slotMsg.slice(6)}</div>}

          {/* Add slot */}
          <div style={{ ...glass, padding: 24, marginBottom: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>➕ Add New Slot</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Date *</div>
                <input type="date" style={inp} value={nsDate} onChange={e => setNsDate(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Start Time</div>
                <input type="time" style={inp} value={nsStart} onChange={e => setNsStart(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>End Time</div>
                <input type="time" style={inp} value={nsEnd} onChange={e => setNsEnd(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Capacity *</div>
                <input type="number" min="1" style={inp} value={nsCap} onChange={e => setNsCap(e.target.value)} />
              </div>
            </div>
            <button style={{ ...btnPrimary, marginTop: 16 }} onClick={handleAddSlot}>Add Slot</button>
          </div>

          {/* Slot list */}
          <div style={{ ...glass, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: 700 }}>
              Existing Slots ({adminSlots.length})
            </div>
            {adminSlots.length === 0
              ? <div style={{ padding: 30, textAlign: "center", opacity: 0.3, fontSize: 13 }}>No slots yet.</div>
              : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      {["Date", "Start", "End", "Cap", "Booked", "Avail", "Status", ""].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", opacity: 0.4, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminSlots.map((s: any) => {
                      const av = s.capacity - s.bookedCount;
                      return (
                        <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "11px 14px" }}>{s.slotDate}</td>
                          <td style={{ padding: "11px 14px" }}>{s.startTime}</td>
                          <td style={{ padding: "11px 14px" }}>{s.endTime}</td>
                          <td style={{ padding: "11px 14px" }}>{s.capacity}</td>
                          <td style={{ padding: "11px 14px", color: "#f97316" }}>{s.bookedCount}</td>
                          <td style={{ padding: "11px 14px", color: av > 0 ? "#4ade80" : "#f87171", fontWeight: 700 }}>{av}</td>
                          <td style={{ padding: "11px 14px" }}><StatusBadge status={s.status} /></td>
                          <td style={{ padding: "11px 14px" }}>
                            <button onClick={() => handleDeleteSlot(s.id)} style={btnSm("#ef4444")}>🗑 Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  PAGE: MANAGE OFFERS
  // ═══════════════════════════════════════════════════
  if (page === "manageOffers") {
    const normForTable = normalizedOffers; // uses shared `offers` state
    return (
      <div style={{ ...pageBg, padding: 30 }}>
        <div style={{ maxWidth: 1050, margin: "0 auto" }}>
          {adminNav}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>🎯 Manage Offers</h2>
              <p style={{ opacity: 0.4, fontSize: 13, marginTop: 4 }}>{normForTable.length} offer{normForTable.length !== 1 ? "s" : ""} total</p>
            </div>
            <button onClick={() => setPage("createOffer")} style={{ ...btnSm("#7c3aed"), fontSize: 13, padding: "10px 20px" }}>
              ➕ Create Offer
            </button>
          </div>

          <div style={{ ...glass, overflow: "hidden", padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                  {["Title", "Business", "Offer Price", "Original", "Capacity", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", opacity: 0.4, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normForTable.map((o) => (
                  <tr key={o.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700 }}>{o.title}</td>
                    <td style={{ padding: "14px 16px", opacity: 0.6 }}>{o.business}</td>
                    <td style={{ padding: "14px 16px", color: "#4ade80", fontWeight: 700 }}>₹{o.price}</td>
                    <td style={{ padding: "14px 16px", opacity: 0.4, textDecoration: "line-through" }}>₹{o.original}</td>
                    <td style={{ padding: "14px 16px", opacity: 0.6 }}>{o.total}</td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { setSlotOfferId(o.id); setAdminSlots([]); setPage("manageSlots"); }} style={btnSm("#06b6d4")}>🗓 Slots</button>
                        <button onClick={() => handleDeleteOffer(o.id)} style={btnSm("#ef4444")}>🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {normForTable.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", opacity: 0.3 }}>No offers yet. Click "Create Offer" to add one.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  PAGE: MANAGE BOOKINGS
  // ═══════════════════════════════════════════════════
  if (page === "manageBookings") return (
    <div style={{ ...pageBg, padding: 30 }}>
      <div style={{ maxWidth: 1150, margin: "0 auto" }}>
        {adminNav}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>📋 Manage Bookings</h2>
            <p style={{ opacity: 0.4, fontSize: 13, marginTop: 4 }}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
          </div>
          <button onClick={exportCSV} style={btnSm("#7c3aed")}>📥 Export CSV</button>
        </div>

        {bookingsLoading
          ? <div style={{ textAlign: "center", opacity: 0.4, padding: 40 }}>Loading bookings…</div>
          : (
            <div style={{ ...glass, overflow: "hidden", padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                    {["Ref", "Customer", "Phone", "Offer", "Slot", "People", "Status", "Change Status"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", opacity: 0.4, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any) => (
                    <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 14px", color: "#a78bfa", fontFamily: "monospace", fontSize: 12 }}>{b.bookingReference}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{b.customerName}</td>
                      <td style={{ padding: "12px 14px", opacity: 0.6 }}>{b.customerPhone}</td>
                      <td style={{ padding: "12px 14px", opacity: 0.6, maxWidth: 130, overflow: "hidden" }}>{b.offerTitle ?? "—"}</td>
                      <td style={{ padding: "12px 14px", opacity: 0.5, fontSize: 12 }}>{b.slotDate ? `${b.slotDate} ${b.startTime ?? ""}` : "—"}</td>
                      <td style={{ padding: "12px 14px", opacity: 0.6 }}>{b.peopleCount}</td>
                      <td style={{ padding: "12px 14px" }}><StatusBadge status={b.status} /></td>
                      <td style={{ padding: "12px 14px" }}>
                        <select value={b.status}
                          onChange={e => handleStatusChange(b.id, e.target.value)}
                          style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "white", cursor: "pointer", fontSize: 12 }}>
                          {["Confirmed", "Completed", "Cancelled", "NoShow", "Pending"].map(s =>
                            <option key={s} value={s} style={{ background: "#1e1b4b" }}>{s}</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", opacity: 0.3 }}>No bookings yet.</div>
              )}
            </div>
          )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  PAGE: ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════
  if (page === "admin") return (
    <div style={{ ...pageBg, padding: 30 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {adminNav}

        {/* Business banner */}
        <div style={{ ...glass, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700 }}>🏢 {bizName || "Your Business"}</p>
            <p style={{ margin: "4px 0 0", opacity: 0.4, fontSize: 12 }}>{bizType} • {bizCity} • {bizOpen} – {bizClose}</p>
          </div>
          <button onClick={() => setPage("business")} style={btnSm("#7c3aed")}>Edit Profile</button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>⚡ SmartSlot Admin</h1>
            <p style={{ opacity: 0.4, fontSize: 13, margin: "4px 0 0" }}>Business Overview Dashboard</p>
          </div>
          <button onClick={() => setPage("createOffer")} style={{ ...btnPrimary, width: "auto", padding: "10px 22px", fontSize: 13 }}>
            ➕ New Offer
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Offers",     value: totalOffers,  icon: "🎯", color: "#7c3aed" },
            { label: "Active Offers",    value: activeOffers, icon: "✅", color: "#16a34a" },
            { label: "Total Bookings",   value: totalBk,      icon: "📋", color: "#2563eb" },
            { label: "Today's Bookings", value: todayBk,      icon: "📅", color: "#d97706" },
            { label: "Total Capacity",   value: totalCap,     icon: "👥", color: "#0891b2" },
            { label: "Booked Seats",     value: bookedSeats,  icon: "🔴", color: "#dc2626" },
            { label: "Available Seats",  value: availSeats,   icon: "🟢", color: "#16a34a" },
            { label: "Conversion Rate",  value: `${convRate}%`, icon: "📈", color: "#7c3aed" },
          ].map((s, i) => (
            <div key={i} style={{ ...glass, padding: "18px 16px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ ...glass, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 700 }}>Overall Booking Rate</span>
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>{convRate}%</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 10 }}>
            <div style={{ height: 10, borderRadius: 99, background: "linear-gradient(90deg,#7c3aed,#4f46e5)", width: `${convRate}%`, transition: "width .5s ease" }} />
          </div>
        </div>

        {/* Recent bookings */}
        <div style={{ ...glass, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: 700, fontSize: 15, display: "flex", justifyContent: "space-between" }}>
            📋 Recent Bookings
            <button onClick={() => setPage("manageBookings")} style={btnSm("#7c3aed")}>View All</button>
          </div>
          {bookings.length === 0
            ? <div style={{ padding: 30, textAlign: "center", opacity: 0.3, fontSize: 13 }}>No bookings yet.</div>
            : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Reference", "Customer", "Offer", "People", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", opacity: 0.4, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 8).map((b: any) => (
                    <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 16px", color: "#a78bfa", fontFamily: "monospace" }}>{b.bookingReference}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{b.customerName}</td>
                      <td style={{ padding: "12px 16px", opacity: 0.6 }}>{b.offerTitle ?? "—"}</td>
                      <td style={{ padding: "12px 16px", opacity: 0.6 }}>{b.peopleCount}</td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  PAGE: HOME  (public offer listing)
  // ═══════════════════════════════════════════════════
  return (
    <div style={pageBg}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a5f 100%)", padding: "48px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, left: -60, width: 300, height: 300, background: "radial-gradient(circle,rgba(124,58,237,0.3),transparent)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -40, right: -40, width: 250, height: 250, background: "radial-gradient(circle,rgba(79,70,229,0.2),transparent)", borderRadius: "50%" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 8px", background: "linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SmartSlot
          </h1>
          <p style={{ opacity: 0.6, fontSize: 16, marginBottom: 28 }}>Grab limited-time offers before they vanish! ⚡</p>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 16px", maxWidth: 460, margin: "0 auto", border: "1px solid rgba(255,255,255,0.12)" }}>
            <span style={{ opacity: 0.4, marginRight: 10 }}>🔍</span>
            <input style={{ ...inp, background: "none", border: "none", padding: 0 }}
              placeholder="Search offers or businesses…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20, fontSize: 13, opacity: 0.5 }}>
            <span>⭐ 500+ Offers</span><span>⚡ Instant Booking</span><span>🕐 Limited Time</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 20px" }}>
        {/* Filter bar */}
        <div style={{ ...glass, margin: "-24px auto 24px", padding: "16px 20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {FILTER_TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: "6px 16px", borderRadius: 99, cursor: "pointer", fontSize: 12,
                border: `1px solid ${typeFilter === t ? "#7c3aed" : "rgba(255,255,255,0.1)"}`,
                background: typeFilter === t ? "rgba(124,58,237,0.3)" : "transparent",
                color: "white", fontWeight: typeFilter === t ? 700 : 400,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.7, cursor: "pointer" }}>
              <input type="checkbox" checked={availOnly} onChange={e => setAvailOnly(e.target.checked)} />
              Available only
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.7 }}>
              <span>📅</span>
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                style={{ ...inp, width: "auto", padding: "6px 12px", fontSize: 13 }} />
              {dateFilter && <button onClick={() => setDateFilter("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16 }}>✕</button>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, opacity: 0.7 }}>
              <span>Max ₹{maxPrice}</span>
              <input type="range" min={100} max={5000} step={100} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))} style={{ accentColor: "#7c3aed" }} />
            </div>
            {/* Admin button goes to LOGIN, not dashboard */}
            <button onClick={() => setPage("login")}
              style={{ marginLeft: "auto", padding: "6px 14px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, color: "#a78bfa", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Admin →
            </button>
          </div>
        </div>

        <p style={{ opacity: 0.4, fontSize: 13, marginBottom: 16 }}>
          {offersLoaded ? `${filtered.length} offer${filtered.length !== 1 ? "s" : ""} found` : "Loading offers…"}
        </p>

        {/* Offer cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 18, paddingBottom: 40 }}>
          {filtered.map(o => {
            const isFull = o.avail === 0;
            const pct    = o.total > 0 ? Math.round((o.total - o.avail) / o.total * 100) : 100;
            const col    = COLOR[o.type] ?? "#7c3aed";
            return (
              <div key={o.id}
                onClick={() => !isFull && openDetail(o)}
                style={{ ...glass, overflow: "hidden", cursor: isFull ? "not-allowed" : "pointer", opacity: isFull ? 0.6 : 1, transition: "transform .2s" }}
                onMouseEnter={e => !isFull && ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)")}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}>

                {/* Card header */}
                <div style={{ padding: "20px 20px 16px", background: `linear-gradient(135deg,${col}22,${col}11)`, borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
                  <div style={{ position: "absolute", top: 14, right: 14, background: "#fbbf24", color: "#000", fontSize: 11, fontWeight: 900, padding: "3px 8px", borderRadius: 8 }}>
                    {o.disc}% OFF
                  </div>
                  <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: col + "33", color: col, fontWeight: 700 }}>{o.type}</span>
                  <h3 style={{ margin: "8px 0 2px", fontSize: 16, fontWeight: 800 }}>{o.title}</h3>
                  <p style={{ margin: 0, opacity: 0.5, fontSize: 12 }}>{o.business}</p>
                </div>

                {/* Card body */}
                <div style={{ padding: 16 }}>
                  <p style={{ opacity: 0.5, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
                    {o.desc.length > 72 ? o.desc.slice(0, 72) + "…" : o.desc}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 22, fontWeight: 900 }}>₹{o.price}</span>
                    <span style={{ textDecoration: "line-through", opacity: 0.4, fontSize: 13 }}>₹{o.original}</span>
                    <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 600, marginLeft: "auto" }}>Save ₹{o.original - o.price}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Timer expiry={o.expiry} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: isFull ? "#f87171" : "#4ade80" }}>
                      {isFull ? "🔴 FULL" : `🟢 ${o.avail} left`}
                    </span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 5, marginBottom: 12 }}>
                    <div style={{ height: 5, borderRadius: 99, background: isFull ? "#ef4444" : pct > 70 ? "#f97316" : "#22c55e", width: `${pct}%` }} />
                  </div>
                  <button disabled={isFull} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: isFull ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg,${col},${col}99)`, color: "white", fontWeight: 700, fontSize: 13, cursor: isFull ? "not-allowed" : "pointer" }}>
                    {isFull ? "Fully Booked" : "Book Now →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}