import { useState } from 'react';
import { X, Minus, Plus, CalendarClock } from 'lucide-react';
import { getEarliestSpecialDate, toDateInputValue, isValidBookingDate } from '../utils/specialBookings';
import './SpecialOrderModal.css';

/**
 * Booking modal for Special (pre-order) dishes. Same shape as OrderModal,
 * but adds a delivery date field enforced against the chef's 6pm daily
 * cutoff — the customer can only pick a valid date, never submit an
 * invalid one.
 *
 * Confirming hands back { dish, quantity, bookingDate, total }.
 */
function SpecialOrderModal({ dish, onClose, onConfirm }) {
  const earliest = getEarliestSpecialDate();
  const minDateValue = toDateInputValue(earliest);

  const [quantity, setQuantity] = useState(1);
  const [bookingDate, setBookingDate] = useState(minDateValue);
  const [error, setError] = useState('');

  if (!dish) return null;

  const total = dish.price * quantity;

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () => setQuantity((q) => Math.min(20, q + 1));

  const handleConfirm = () => {
    if (!isValidBookingDate(bookingDate)) {
      setError(`Please pick a date on or after ${minDateValue}.`);
      return;
    }
    onConfirm({ dish, quantity, bookingDate, total });
  };

  return (
    <div
      className="special-order-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="special-order-modal-title"
      onClick={onClose}
    >
      <div className="special-order-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="special-order-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {dish.imageUrl && (
          <div className="special-order-modal__image-wrap">
            <img src={dish.imageUrl} alt={dish.name} className="special-order-modal__image" />
          </div>
        )}

        <span className="special-order-modal__badge">
          <CalendarClock size={12} strokeWidth={2.5} />
          Pre-order — advance booking required
        </span>

        <h3 id="special-order-modal-title" className="special-order-modal__title">{dish.name}</h3>
        <p className="special-order-modal__unit-price">₦{dish.price.toLocaleString()} per serving</p>

        <div className="special-order-modal__field">
          <span className="special-order-modal__field-label">Plates</span>
          <div className="special-order-modal__stepper">
            <button
              type="button"
              onClick={decrease}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="special-order-modal__quantity">{quantity}</span>
            <button type="button" onClick={increase} aria-label="Increase quantity">
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="special-order-modal__date-field">
          <label htmlFor="special-booking-date" className="special-order-modal__field-label">
            Delivery date
          </label>
          <input
            id="special-booking-date"
            type="date"
            className="special-order-modal__date-input"
            min={minDateValue}
            value={bookingDate}
            onChange={(e) => {
              setBookingDate(e.target.value);
              setError('');
            }}
          />
          <p className="special-order-modal__date-hint">
            Needs at least 24 hours' notice — earliest available is {minDateValue}.
          </p>
          {error && <p className="special-order-modal__error">{error}</p>}
        </div>

        <div className="special-order-modal__total">
          <span>Total</span>
          <span className="special-order-modal__total-amount">₦{total.toLocaleString()}</span>
        </div>

        <button type="button" className="special-order-modal__confirm" onClick={handleConfirm}>
          Book this order
        </button>
      </div>
    </div>
  );
}

export default SpecialOrderModal;