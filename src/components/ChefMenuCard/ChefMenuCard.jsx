import { useState } from 'react';
import { Pencil, Trash2, Flame, ImageOff } from 'lucide-react';
import styles from './ChefMenuCard.module.css';

export default function ChefMenuCard({ item, onEdit, onRemove, onToggleStatus }) {
  const [imgError, setImgError] = useState(false);
  const isSoldOut = item.status === 'sold-out';

  return (
    <div className={`${styles.card} ${isSoldOut ? styles.soldOut : ''}`}>
      <div className={styles.imageWrap}>
        {item.photoUrl && !imgError ? (
          <img
            src={item.photoUrl}
            alt={item.name}
            className={styles.image}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.imageFallback}>
            <ImageOff size={22} strokeWidth={1.5} />
          </div>
        )}
        {isSoldOut && <span className={styles.soldOutBadge}>Sold out</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{item.name}</h3>
        <span className={styles.price}>₦{item.price.toLocaleString()}</span>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.statusToggle}
          onClick={() => onToggleStatus(item.id)}
          aria-pressed={!isSoldOut}
        >
          <Flame size={14} strokeWidth={2} />
          {isSoldOut ? 'Mark in stock' : 'Mark sold out'}
        </button>

        <div className={styles.iconActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.name}`}
          >
            <Pencil size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.dangerButton}`}
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}