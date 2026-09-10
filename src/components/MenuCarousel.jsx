import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChefHat } from 'lucide-react';
import MenuCard from './MenuCard';
import './MenuCarousel.css';

/**
 * MenuCarousel
 *
 * Renders the chef's "available today" dishes as a swipeable,
 * peek-style carousel. Defaults to an empty, inviting state —
 * this is never seeded with placeholder dishes; the chef populates
 * `dishes` at runtime.
 *
 * Props:
 *  - dishes: Array<{ id, name, description, price, imageUrl?, spicy?, tags? }>
 *  - onPlaceOrder?: (dish) => void
 */
function MenuCarousel({ dishes = [], onPlaceOrder }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const trackRef = useRef(null);
  const dragState = useRef({ startX: 0, dragging: false });

  const count = dishes.length;

  useEffect(() => {
    // One orchestrated entrance, not per-card hover effects.
    const t = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    // Keep index in range if the dish list shrinks (e.g. chef removes a dish).
    if (activeIndex > count - 1) {
      setActiveIndex(Math.max(0, count - 1));
    }
  }, [count, activeIndex]);

  const goTo = useCallback((index) => {
    if (count === 0) return;
    const next = ((index % count) + count) % count;
    setActiveIndex(next);
  }, [count]);

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  };

  // --- Drag / swipe support ---
  const onPointerDown = (e) => {
    dragState.current.dragging = true;
    dragState.current.startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  };

  const onPointerUp = (e) => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    const delta = endX - dragState.current.startX;
    const threshold = 40;
    if (delta > threshold) goPrev();
    else if (delta < -threshold) goNext();
  };

  if (count === 0) {
    return (
      <div className="menu-carousel menu-carousel--empty">
        <div className="menu-carousel__empty-icon">
          <ChefHat size={30} strokeWidth={2} />
        </div>
        <h3 className="menu-carousel__empty-title">Nothing on the menu yet</h3>
        <p className="menu-carousel__empty-text">
          The chef hasn't posted today's dishes. Check back soon — this
          fills up fast once cooking starts.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`menu-carousel ${hasEntered ? 'menu-carousel--entered' : ''}`}
      role="region"
      aria-label="Today's available dishes"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className="menu-carousel__track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchEnd={onPointerUp}
      >
        {dishes.map((dish, i) => {
          const offset = i - activeIndex;
          // Only render the active card plus its immediate neighbors for the peek effect.
          if (Math.abs(offset) > 1 && !(count <= 3)) return null;
          return (
            <div
              key={dish.id}
              className="menu-carousel__slot"
              style={{ '--offset': offset }}
            >
              <MenuCard
                dish={dish}
                isActive={i === activeIndex}
                onPlaceOrder={onPlaceOrder}
              />
            </div>
          );
        })}
      </div>

      <div className="menu-carousel__controls">
        <button
          type="button"
          className="menu-carousel__nav"
          onClick={goPrev}
          aria-label="Previous dish"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        <span className="menu-carousel__position">
          {activeIndex + 1} of {count}
        </span>

        <button
          type="button"
          className="menu-carousel__nav"
          onClick={goNext}
          aria-label="Next dish"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default MenuCarousel;