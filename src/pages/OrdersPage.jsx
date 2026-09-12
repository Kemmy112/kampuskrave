import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, Clock } from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { supabase } from "../../supabaseClient";
import { formatBookingDate } from "../utils/specialBookings";
import "./OrdersPage.css";

function naira(n) {
  return `₦${n.toLocaleString()}`;
}

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemsSummary(items) {
  return items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
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

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders } = useOrders();

  const [role, setRole] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadIdentity() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (isMounted) {
        setCustomerId(user.id);
        setRole(profile?.role || "customer");
        setLoading(false);
      }
    }

    loadIdentity();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const isChef = role === "chef";

  const [statusFilter, setStatusFilter] = useState("all");

  const visibleOrders = useMemo(() => {
    const base = isChef ? orders : orders.filter((o) => o.customerId === customerId);
    const filtered =
      statusFilter === "all" ? base : base.filter((o) => o.status === statusFilter);
    return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, isChef, customerId, statusFilter]);

  const backPath = isChef ? "/chef" : "/customer";

  if (loading) {
    return (
      <div className="orderspage">
        <p className="orderspage__loading">Loading orders…</p>
      </div>
    );
  }

  return (
    <div className="orderspage">
      <header className="orderspage__header">
        <button className="orderspage__back" onClick={() => navigate(backPath)}>
          <ArrowLeft size={16} /> Back to dashboard
        </button>
        <h1 className="orderspage__title">
          {isChef ? "All orders" : "Your orders"}
        </h1>
        <p className="orderspage__subtitle">
          {isChef
            ? "Every order placed, past and present."
            : "Everything you've ordered, past and present."}
        </p>
      </header>

      <div className="orderspage__filters" role="tablist" aria-label="Filter by status">
        {["all", "pending", "confirmed", "acknowledged", "revoked"].map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={statusFilter === key}
            className={`orderspage__filter-pill ${
              statusFilter === key ? "orderspage__filter-pill--active" : ""
            }`}
            onClick={() => setStatusFilter(key)}
          >
            {key === "all" ? "All" : key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="orderspage__empty">No orders to show here yet.</div>
      ) : (
        <div className="orderspage__list">
          {visibleOrders.map((o) => {
            const meta = statusMeta(o.status);
            const isSpecial = o.orderType === "special";
            return (
              <div key={o.id} className="orderspage__card">
                <div className="orderspage__card-main">
                  {isChef && <div className="orderspage__customer">{o.customerName}</div>}
                  <div className="orderspage__items">{itemsSummary(o.items)}</div>
                  <div className="orderspage__date">{fmtDateTime(o.createdAt)}</div>
                </div>
                <div className="orderspage__card-right">
                  {o.total != null && (
                    <div className="orderspage__total">{naira(o.total)}</div>
                  )}
                  {isSpecial && o.requestedDate && (
                    <div className="orderspage__eta">
                      <CalendarClock size={13} /> booked for {formatBookingDate(o.requestedDate)}
                    </div>
                  )}
                  {!isSpecial && o.deliveryWindowEnd && (
                    <div className="orderspage__eta">
                      <Clock size={13} /> ready by{" "}
                      {new Date(o.deliveryWindowEnd).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                  <span className={`status-pill ${meta.className}`}>{meta.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}