import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, LogOut, Sparkles, Clock, CalendarClock, History } from "lucide-react";
import MenuCarousel from "../components/MenuCarousel";
import OrderModal from "../components/OrderModal";
import SpecialOrderModal from "../components/SpecialOrderModal";
import NotificationBell from "../components/NotificationBell";
import { useMenu } from "../context/MenuContext";
import { useOrders } from "../context/OrderContext";
import { supabase } from "../../supabaseClient";
import { formatBookingDate } from "../utils/specialBookings";
import { isToday } from "../utils/dateUtils";
import "./Customerdashboard.css";
import "./CustomerDashboard.category.css";

const CATEGORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "regular", label: "Regular" },
  { key: "special", label: "Special" },
  { key: "protein", label: "Protein" },
];

// Orders older than this stop showing on the live dashboard — they still
// live in full on the dedicated Orders page (see OrdersPage.jsx).

function naira(n) {
  return `₦${n.toLocaleString()}`;
}

function fmtClock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function statusMeta(status) {
  switch (status) {
    case "pending":
      return { label: "Pending confirmation", className: "status-pill--pending" };
    case "confirmed":
      return { label: "Confirmed", className: "status-pill--confirmed" };
    case "acknowledged":
      return { label: "Payment acknowledged", className: "status-pill--acknowledged" };
    case "revoked":
      return { label: "Revoked", className: "status-pill--revoked" };
    default:
      return { label: status, className: "status-pill--default" };
  }
}

function itemsSummary(items) {
  return items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
}

function firstNameFrom(fullName) {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0];
}

export default function CustomerDashboard() {
  const navigate = useNavigate();

  // Real identity, pulled from the logged-in Supabase user + their profiles
  // row. `fullName` is the raw value from the profile — used for anything
  // that leaves this component (order records). `customerName` is the
  // first-name-only version — used purely for on-screen greetings.
  const [customerId, setCustomerId] = useState(null);
  const [fullName, setFullName] = useState("");
  const [customerName, setCustomerName] = useState("there");
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (isMounted) {
        setCustomerId(user.id);
        setFullName(profile?.full_name || "");
        setCustomerName(firstNameFrom(profile?.full_name));
        setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Live menu, shared with ChefDashboard via MenuContext. todayMenu is
  // already date-filtered to strictly today's dishes — customers never see
  // yesterday's leftovers even if the chef hasn't closed out yet.
  const { todayMenu } = useMenu();
  const fullMenu = todayMenu.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    soldOut: item.status === "sold-out",
    imageUrl: item.photoUrl,
    category: item.category || "regular",
  }));

  const [categoryFilter, setCategoryFilter] = useState("all");
  const menu = useMemo(
    () =>
      categoryFilter === "all"
        ? fullMenu
        : fullMenu.filter((dish) => dish.category === categoryFilter),
    [fullMenu, categoryFilter]
  );

  // Live orders, shared with ChefDashboard via OrderContext.
  const { orders: contextOrders, addOrderItem, addSpecialOrderItem, acknowledgeOrder } = useOrders();

  const myOrders = contextOrders.filter((o) => o.customerId === customerId);

  // Dashboard only shows recent activity — anything older than 24h rolls
  // off onto the dedicated Orders page instead of piling up here.
const orders = myOrders
  .filter((o) => {
    if (o.status === 'pending' || o.status === 'confirmed') return true;
    return isToday(o.createdAt);
  })
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const firstTime = !contextOrders.some(
    (o) => o.customerId === customerId && (o.status === "confirmed" || o.status === "acknowledged")
  );

  // orderingDish is whichever dish the customer just tapped "order" on —
  // its category decides which modal renders below.
  const [orderingDish, setOrderingDish] = useState(null);

  const handlePlaceOrderClick = (dish) => {
    setOrderingDish(dish);
  };

  const handleCloseModal = () => {
    setOrderingDish(null);
  };

  const handleConfirmOrder = ({ dish, quantity }) => {
    addOrderItem(customerId, fullName, { id: dish.id, name: dish.name, price: dish.price }, quantity);
    setOrderingDish(null);
  };

  const handleConfirmSpecialOrder = ({ dish, quantity, bookingDate }) => {
    addSpecialOrderItem(
      customerId,
      fullName,
      { id: dish.id, name: dish.name, price: dish.price },
      quantity,
      bookingDate
    );
    setOrderingDish(null);
  };

  const handlePayNow = (orderId) => {
    // Stub until real payment is wired in — simulates a completed payment
    // by marking the order acknowledged.
    acknowledgeOrder(orderId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (profileLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard__body">
          <p className="dashboard__greeting-subtitle">Loading your kitchen…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <span className="dashboard__brand-icon">
            <ChefHat size={18} />
          </span>
          <span className="dashboard__brand-name">Today's kitchen</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NotificationBell role="customer" customerId={customerId} />
          <button className="dashboard__signout" onClick={() => navigate("/orders")}>
            <History size={14} /> Order history
          </button>
          <button className="dashboard__signout" onClick={handleSignOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="dashboard__body">
        <div className="dashboard__greeting">
          <h2 className="dashboard__greeting-title">
            {getGreeting()}, {customerName}
          </h2>
          <p className="dashboard__greeting-subtitle">Here's what's cooking today.</p>
        </div>

        {firstTime && (
          <div className="dashboard__banner">
            <span className="dashboard__banner-icon">
              <Sparkles size={17} />
            </span>
            <div className="dashboard__banner-text">
              <b>30% off your first order</b> — applied automatically at checkout, no code needed.
            </div>
          </div>
        )}

        <div className="dashboard__section-head">
          <h3 className="dashboard__section-title">Available Now </h3>
          <span className="dashboard__section-count">
            {menu.filter((m) => !m.soldOut).length} of {menu.length} items left
          </span>
        </div>

        {fullMenu.length === 0 ? (
          <div className="dashboard__orders-empty">
            We're closed for today — check back soon for the next menu.
          </div>
        ) : (
          <>
            <div className="dashboard__category-pills" role="tablist" aria-label="Filter menu by category">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === filter.key}
                  className={`dashboard__category-pill ${
                    categoryFilter === filter.key ? "dashboard__category-pill--active" : ""
                  }`}
                  onClick={() => setCategoryFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <MenuCarousel dishes={menu} onPlaceOrder={handlePlaceOrderClick} />
          </>
        )}

        <h3 className="dashboard__section-title dashboard__orders-title">Your orders</h3>

        {orders.length === 0 ? (
          <div className="dashboard__orders-empty">
            No orders yet — pick something from today's menu above.
          </div>
        ) : (
          <div className="dashboard__orders">
            {orders.map((o) => {
              const meta = statusMeta(o.status);
              const isSpecial = o.orderType === "special";
              return (
                <div key={o.id} className="order-card">
                  <div>
                    <div className="order-card__name">{itemsSummary(o.items)}</div>
                    <div className="order-card__meta">
                      placed {fmtClock(o.createdAt)}
                      {o.isFirstOrder ? " · first order discount applied" : ""}
                    </div>
                  </div>
                  <div className="order-card__right">
                    {o.total != null && (
                      <div className="order-card__total">{naira(o.total)}</div>
                    )}
                    {isSpecial && o.requestedDate && (
                      <div className="order-card__eta">
                        <CalendarClock size={13} /> booked for {formatBookingDate(o.requestedDate)}
                      </div>
                    )}
                    {!isSpecial && o.deliveryWindowEnd && (
                      <div className="order-card__eta">
                        <Clock size={13} /> ready by {fmtClock(o.deliveryWindowEnd)}
                      </div>
                    )}
                    <span className={`status-pill ${meta.className}`}>{meta.label}</span>
                    {o.status === "confirmed" && (
                      <button
                        type="button"
                        className="order-card__pay-btn"
                        onClick={() => handlePayNow(o.id)}
                      >
                        Pay now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {orderingDish && orderingDish.category === "special" && (
        <SpecialOrderModal
          dish={orderingDish}
          onClose={handleCloseModal}
          onConfirm={handleConfirmSpecialOrder}
        />
      )}

      {orderingDish && orderingDish.category !== "special" && (
        <OrderModal
          dish={orderingDish}
          onClose={handleCloseModal}
          onConfirm={handleConfirmOrder}
        />
      )}
    </div>
  );
}