import { Flame, ShoppingBag, CalendarClock } from 'lucide-react';
import './MenuCard.css';
import './MenuCard.category.css';

/**
 * A single dish card. Purely presentational — the carousel controls
 * position, scale, and which card is "active". Ordering happens via
 * the explicit "Place an order" button, not by clicking the card.
 *
 * dish shape:
 * {
 *   id: string,
 *   name: string,
 *   description: string,
 *   price: number,
 *   imageUrl?: string,
 *   spicy?: boolean,
 *   tags?: string[],
 *   soldOut?: boolean,
 *   category?: 'regular' | 'special' | 'protein'  // defaults to 'regular'
 * }
 *
 * category drives layout:
 *   - 'protein' renders a compact, image-less card (name + price + button)
 *   - 'special' renders the normal photo layout with a wine/berry tint and
 *     a "Pre-order" badge — the parent is responsible for routing its
 *     onPlaceOrder into a booking-date flow instead of the regular one
 *   - 'regular' (or unset) renders exactly as before
 */
function MenuCard({ dish, isActive, onPlaceOrder }) {
  const soldOut = Boolean(dish.soldOut);
  const category = dish.category || 'regular';
  const isProtein = category === 'protein';
  const isSpecial = category === 'special';

  const cardClassName = [
    'menu-card',
    isActive ? 'menu-card--active' : 'menu-card--peek',
    soldOut ? 'menu-card--sold-out' : '',
    isProtein ? 'menu-card--protein' : '',
    isSpecial ? 'menu-card--special' : '',
  ]
    .join(' ')
    .trim();

  if (isProtein) {
    return (
      <div className={cardClassName} aria-current={isActive}>
        <div className="menu-card__protein-body">
          <div className="menu-card__protein-row">
            <h3 className="menu-card__name menu-card__name--protein">{dish.name}</h3>
            <span
              className={[
                'menu-card__price',
                'menu-card__price--inline',
                soldOut ? 'menu-card__price--sold-out' : '',
              ]
                .join(' ')
                .trim()}
            >
              {soldOut ? 'Sold out' : `₦${dish.price?.toLocaleString()}`}
            </span>
          </div>

          <button
            type="button"
            className="menu-card__order-btn"
            disabled={soldOut}
            onClick={() => onPlaceOrder?.(dish)}
          >
            <ShoppingBag size={14} strokeWidth={2.5} />
            {soldOut ? 'Unavailable' : 'Add'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClassName} aria-current={isActive}>
      <div className="menu-card__image-wrap">
        {dish.imageUrl ? (
          <img src={dish.imageUrl} alt={dish.name} className="menu-card__image" />
        ) : (
          <div className="menu-card__image menu-card__image--placeholder" />
        )}
        {dish.spicy && !soldOut && (
          <span className="menu-card__spicy" aria-label="Spicy">
            <Flame size={14} strokeWidth={2.5} />
          </span>
        )}
        {isSpecial && (
          <span className="menu-card__special-badge">
            <CalendarClock size={12} strokeWidth={2.5} />
            Pre-order
          </span>
        )}
        {soldOut ? (
          <span className="menu-card__price menu-card__price--sold-out">Sold out</span>
        ) : (
          <span className="menu-card__price">₦{dish.price?.toLocaleString()}</span>
        )}
      </div>

      <div className="menu-card__body">
        <h3 className="menu-card__name">{dish.name}</h3>
        {dish.description && (
          <p className="menu-card__description">{dish.description}</p>
        )}
        {isSpecial && !dish.description && (
          <p className="menu-card__description menu-card__description--special">
            Booked in advance — pick your delivery date at checkout.
          </p>
        )}
        {dish.tags?.length > 0 && (
          <div className="menu-card__tags">
            {dish.tags.map((tag) => (
              <span key={tag} className="menu-card__tag">{tag}</span>
            ))}
          </div>
        )}

        <button
          type="button"
          className="menu-card__order-btn"
          disabled={soldOut}
          onClick={() => onPlaceOrder?.(dish)}
        >
          <ShoppingBag size={15} strokeWidth={2.5} />
          {soldOut ? 'Unavailable' : isSpecial ? 'Book this' : 'Place an order'}
        </button>
      </div>
    </div>
  );
}

export default MenuCard;