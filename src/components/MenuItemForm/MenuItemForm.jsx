import { useState, useEffect } from 'react';
import { X, UtensilsCrossed } from 'lucide-react';
import styles from './MenuItemForm.module.css';

const emptyForm = { name: '', photoUrl: '', price: '', category: 'regular' };

export default function MenuItemForm({ open, initialItem, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const isEditing = Boolean(initialItem);

  useEffect(() => {
    if (open) {
      setForm(
        initialItem
          ? {
              name: initialItem.name,
              photoUrl: initialItem.photoUrl || '',
              price: initialItem.price,
              category: initialItem.category || 'regular',
            }
          : emptyForm
      );
      setError('');
    }
  }, [open, initialItem]);

  if (!open) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Give the dish a name.');
      return;
    }
    const priceNumber = Number(form.price);
    if (!form.price || Number.isNaN(priceNumber) || priceNumber <= 0) {
      setError('Enter a valid price.');
      return;
    }
    onSubmit({
      name: form.name.trim(),
      photoUrl: form.photoUrl.trim(),
      price: priceNumber,
      category: form.category,
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <UtensilsCrossed size={18} strokeWidth={2} />
          </div>
          <h2 id="menu-item-form-title" className={styles.title}>
            {isEditing ? 'Edit dish' : 'Add a dish'}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Dish name</span>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Jollof Rice & Chicken"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Photo URL</span>
            <input
              type="text"
              className={styles.input}
              placeholder="/menu/jollof-rice.jpg"
              value={form.photoUrl}
              onChange={(e) => handleChange('photoUrl', e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Price (₦)</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              className={styles.input}
              placeholder="3500"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Category</span>
            <select
              className={styles.input}
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="regular">Regular</option>
              <option value="special">Special (pre-order)</option>
              <option value="protein">Protein add-on</option>
            </select>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton}>
            {isEditing ? 'Save changes' : 'Add to menu'}
          </button>
        </form>
      </div>
    </div>
  );
}