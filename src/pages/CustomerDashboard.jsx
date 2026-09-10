import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, LogOut, Sparkles, Clock, CalendarClock } from "lucide-react";
import MenuCarousel from "../components/MenuCarousel";
import OrderModal from "../components/OrderModal";
import SpecialOrderModal from "../components/SpecialOrderModal";
import { useMenu } from "../context/MenuContext";
import { useOrders } from "../context/OrderContext";
import { supabase } from "../../supabaseClient";
import { formatBookingDate } from "../utils/specialBookings";
import "./Customerdashboard.css";
import "./CustomerDashboard.category.css";

const CATEGORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "regular", label: "Regular" },
  { key: "special", label: "Special" },
  { key: "protein", label: "Protein" },
];

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
  // row.
  const [customerId, setCustomerId] = useState(null);
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
        setCustomerName(firstNameFrom(profile?.full_name));
        setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Live menu, shared with ChefDashboard via MenuContext. MenuContext stores
  // { status: 'in-stock' | 'sold-out', photoUrl, category }, but
  // MenuCarousel/MenuCard expect { soldOut: boolean, imageUrl, category } —
  // map the shape here rather than touching those components.
  const { menu: contextMenu } = useMenu();
  const fullMenu = contextMenu.map((item) => ({
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
  const orders = contextOrders
    .filter((o) => o.customerId === customerId)
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
    addOrderItem(customerId, customerName, { id: dish.id, name: dish.name, price: dish.price }, quantity);
    setOrderingDish(null);
  };

  const handleConfirmSpecialOrder = ({ dish, quantity, bookingDate }) => {
    addSpecialOrderItem(
      customerId,
      customerName,
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
        <button className="dashboard__signout" onClick={handleSignOut}>
          <LogOut size={14} /> Sign out
        </button>
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