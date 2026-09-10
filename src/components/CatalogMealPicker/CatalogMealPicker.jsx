import { useState } from 'react';
import { Check, X, ImageOff, UtensilsCrossed } from 'lucide-react';
import mealCatalog from '../../data/mealCatalog';
import styles from './CatalogMealPicker.module.css';

export default function CatalogMealPicker({ open, existingNames = [], onClose, onConfirm, onAddCustom }) {
  const [selected, setSelected] = useState({}); // { [catalogId]: price }

  if (!open) return null;

  const selectedIds = Object.keys(selected);
  const alreadyOnMenu = new Set(existingNames);

  function toggleMeal(meal) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[meal.id] !== undefined) {
        delete next[meal.id];
      } else {
        next[meal.id] = meal.basePrice;
      }
      return next;
    });
  }

  function updatePrice(id, price) {
    setSelected((prev) => ({ ...prev, [id]: price }));
  }

  function handleClose() {
    setSelected({});
    onClose();
  }

 function handleConfirm() {
  const itemsToAdd = mealCatalog
    .filter((meal) => selected[meal.id] !== undefined)
    .map((meal) => ({
      name: meal.name,
      photoUrl: meal.photoUrl,
      price: Number(selected[meal.id]) || meal.basePrice,
      category: meal.category,
    }));
  onConfirm(itemsToAdd);
  setSelected({});
}
  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 id="catalog-picker-title" className={styles.title}>
              What's on today?
            </h2>
            <p className={styles.subtitle}>Pick the dishes you're serving — adjust prices if needed.</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.grid}>
          {mealCatalog.map((meal) => {
            const isSelected = selected[meal.id] !== undefined;
            const isOnMenu = alreadyOnMenu.has(meal.name);
            return (
              <div
                key={meal.id}
                className={`${styles.mealCard} ${isSelected ? styles.mealCardSelected : ''} ${
                  isOnMenu ? styles.mealCardDisabled : ''
                }`}
              >
                <button
                  type="button"
                  className={styles.mealButton}
                  onClick={() => !isOnMenu && toggleMeal(meal)}
                  disabled={isOnMenu}
                >
                  <div className={styles.imageWrap}>
                    <ImageFallback src={meal.photoUrl} alt={meal.name} />
                    <span className={`${styles.checkCircle} ${isSelected ? styles.checkCircleActive : ''}`}>
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </span>
                  </div>
                  <span className={styles.mealName}>{meal.name}</span>
                  {isOnMenu && <span className={styles.onMenuTag}>Already on today's menu</span>}
                </button>

                {isSelected && !isOnMenu && (
                  <div className={styles.priceRow}>
                    <span className={styles.naira}>₦</span>
                    <input
                      type="number"
                      min="0"
                      className={styles.priceInput}
                      value={selected[meal.id]}
                      onChange={(e) => updatePrice(meal.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.customButton} onClick={onAddCustom}>
            <UtensilsCrossed size={15} strokeWidth={2} />
            Add a custom dish instead
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            disabled={selectedIds.length === 0}
            onClick={handleConfirm}
          >
            Add {selectedIds.length > 0 ? selectedIds.length : ''} dish
            {selectedIds.length === 1 ? '' : 'es'} to today's menu
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageFallback({ src, alt }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className={styles.imageFallback}>
        <ImageOff size={18} strokeWidth={1.5} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={styles.image} onError={() => setErrored(true)} />;
}