import { Check, Clock, User, CalendarClock } from 'lucide-react';
import { formatBookingDate } from '../../utils/specialBookings';
import styles from './OrderQueueItem.module.css';

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  acknowledged: 'Acknowledged',
  revoked: 'Revoked',
};

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export default function OrderQueueItem({ order, onConfirm }) {
  const isPending = order.status === 'pending';
  const isSpecial = order.orderType === 'special';

  return (
    <div className={`${styles.card} ${styles[order.status] || ''} ${isSpecial ? styles.special : ''}`}>
      <div className={styles.top}>
        <div className={styles.customer}>
          <User size={15} strokeWidth={2} />
          <span>{order.customerName}</span>
        </div>
        <span className={`${styles.statusPill} ${styles[`pill_${order.status}`]}`}>
          {STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      {isSpecial && order.requestedDate && (
        <div className={styles.bookingTag}>
          <CalendarClock size={13} strokeWidth={2} />
          Booked for {formatBookingDate(order.requestedDate)}
        </div>
      )}

      <ul className={styles.itemList}>
        {order.items.map((line) => (
          <li key={line.menuItemId} className={styles.item}>
            <span>
              {line.quantity} × {line.name}
            </span>
            <span>₦{(line.price * line.quantity).toLocaleString()}</span>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <div className={styles.meta}>
          {order.isFirstOrder && <span className={styles.discountTag}>First order · 30% off</span>}
          <span className={styles.timeTag}>
            <Clock size={12} strokeWidth={2} />
            {timeAgo(order.createdAt)}
          </span>
        </div>
        <span className={styles.total}>₦{order.total.toLocaleString()}</span>
      </div>

      {isPending && (
        <button type="button" className={styles.confirmButton} onClick={() => onConfirm(order.id)}>
          <Check size={16} strokeWidth={2.5} />
          Confirm order
        </button>
      )}
    </div>
  );
}