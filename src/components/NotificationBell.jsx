import { useState, useEffect, useMemo, useRef } from "react";
import { Bell } from "lucide-react";
import { useOrders } from "../context/OrderContext";
import "./NotificationBell.css";

function itemsSummary(items) {
  return items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell({ role, customerId }) {
  const { orders } = useOrders();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const storageKey = role === "chef" ? "notif_seen_chef" : `notif_seen_customer_${customerId}`;
  const [lastSeen, setLastSeen] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? Number(stored) : 0;
  });

  // Chef: notified whenever any new order is placed.
  // Customer: notified only when one of THEIR orders is confirmed.
  const events = useMemo(() => {
    if (role === "chef") {
      return orders
        .filter((o) => o.status !== "revoked")
        .map((o) => ({
          id: `${o.id}-placed`,
          timestamp: o.createdAt,
          text: `New order from ${o.customerName}: ${itemsSummary(o.items)}`,
        }));
    }
    return orders
      .filter((o) => o.customerId === customerId && o.status !== "pending" && o.confirmedAt)
      .map((o) => ({
        id: `${o.id}-confirmed`,
        timestamp: o.confirmedAt,
        text: `Your order (${itemsSummary(o.items)}) has been confirmed`,
      }));
  }, [orders, role, customerId]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20),
    [events]
  );

  const unreadCount = sortedEvents.filter(
    (e) => new Date(e.timestamp).getTime() > lastSeen
  ).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const now = Date.now();
        localStorage.setItem(storageKey, String(now));
        setLastSeen(now);
      }
      return next;
    });
  }

  return (
    <div className="notif-bell" ref={containerRef}>
      <button
        type="button"
        className="notif-bell__trigger"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-bell__dropdown">
          <div className="notif-bell__header">Notifications</div>
          {sortedEvents.length === 0 ? (
            <div className="notif-bell__empty">Nothing yet.</div>
          ) : (
            <div className="notif-bell__list">
              {sortedEvents.map((e) => (
                <div key={e.id} className="notif-bell__item">
                  <p className="notif-bell__text">{e.text}</p>
                  <span className="notif-bell__time">{timeAgo(e.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}