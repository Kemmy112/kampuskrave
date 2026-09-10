import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import './OrderModal.css';

/**
 * Quantity modal shown after "Place an order" is tapped on a dish.
 * Confirming hands back { dish, quantity, total } to the caller,
 * which is responsible for creating the order record.
 */
function OrderModal({ dish, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1);

  if (!dish) return null;

  const total = dish.price * quantity;

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () => setQuantity((q) => Math.min(20, q + 1));

  const handleConfirm = () => {
    onConfirm({ dish, quantity, total });
  };

  return (
    <div
      className="order-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      onClick={onClose}
    >
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="order-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {dish.imageUrl && (
          <div className="order-modal__image-wrap">
            <img src={dish.imageUrl} alt={dish.name} className="order-modal__image" />
          </div>
        )}

        <h3 id="order-modal-title" className="order-modal__title">{dish.name}</h3>
        <p className="order-modal__unit-price">₦{dish.price.toLocaleString()} per plate</p>

        <div className="order-modal__field">
          <span className="order-modal__field-label">Plates</span>
          <div className="order-modal__stepper">
            <button
              type="button"
              onClick={decrease}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="order-modal__quantity">{quantity}</span>
            <button type="button" onClick={increase} aria-label="Increase quantity">
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="order-modal__total">
          <span>Total</span>
          <span className="order-modal__total-amount">₦{total.toLocaleString()}</span>
        </div>

        <button type="button" className="order-modal__confirm" onClick={handleConfirm}>
          Place order
        </button>
      </div>
    </div>
  );
}

export default OrderModal;