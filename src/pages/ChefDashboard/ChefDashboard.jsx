import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChefHat, ClipboardList, LogOut } from 'lucide-react';
import { useMenu } from '../../context/MenuContext';
import { useOrders } from '../../context/OrderContext';
import { supabase } from '../../../supabaseClient';
import ChefMenuCard from '../../components/ChefMenuCard/ChefMenuCard';
import MenuItemForm from '../../components/MenuItemForm/MenuItemForm';
import CatalogMealPicker from '../../components/CatalogMealPicker/CatalogMealPicker';
import OrderQueueItem from '../../components/OrderQueueItem/OrderQueueItem';
import styles from './ChefDashboard.module.css';

const CATEGORY_ORDER = ['regular', 'special', 'protein'];
const CATEGORY_LABELS = {
  regular: 'Regular',
  special: 'Special (pre-order)',
  protein: 'Protein add-ons',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function ChefDashboard({ chefName = 'Chef' }) {
  const navigate = useNavigate();
  const { menu, addMenuItem, updateMenuItem, removeMenuItem, toggleStatus } = useMenu();
  const { orders, confirmOrder } = useOrders();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Group today's menu by category so the chef sees Regular / Special /
  // Protein as distinct sections instead of one flat grid. Anything with
  // an unrecognized or missing category falls back into 'regular'.
  const menuByCategory = useMemo(() => {
    const groups = { regular: [], special: [], protein: [] };
    menu.forEach((item) => {
      const cat = item.category || 'regular';
      (groups[cat] || groups.regular).push(item);
    });
    return groups;
  }, [menu]);

  const activeOrders = useMemo(
    () =>
      [...orders]
        .filter((o) => o.status !== 'revoked')
        .sort((a, b) => {
          const rank = { pending: 0, confirmed: 1, acknowledged: 2 };
          return rank[a.status] - rank[b.status] || new Date(b.createdAt) - new Date(a.createdAt);
        }),
    [orders]
  );

  const pendingCount = activeOrders.filter((o) => o.status === 'pending').length;

  function openCatalog() {
    setCatalogOpen(true);
  }

  function openCustomForm() {
    setCatalogOpen(false);
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEditForm(item) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleCatalogConfirm(itemsToAdd) {
    itemsToAdd.forEach((item) => addMenuItem(item));
    setCatalogOpen(false);
  }

  function handleFormSubmit(data) {
    if (editingItem) {
      updateMenuItem(editingItem.id, data);
    } else {
      addMenuItem(data);
    }
    setFormOpen(false);
    setEditingItem(null);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>
            {getGreeting()}, {chefName}
          </p>
          <h1 className={styles.title}>Your kitchen today</h1>
        </div>
        <div className={styles.headerActions}>
          {menu.length > 0 && (
            <button type="button" className={styles.addButton} onClick={openCatalog}>
              <Plus size={18} strokeWidth={2.5} />
              Add a dish
            </button>
          )}
          <button type="button" className={styles.signOutButton} onClick={handleSignOut}>
            <LogOut size={16} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Today's menu</h2>

        {menu.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ChefHat size={26} strokeWidth={1.5} />
            </div>
            <h3 className={styles.emptyTitle}>Your place is closed for now</h3>
            <p className={styles.emptyText}>
              Add today's dishes so customers can start ordering.
            </p>
            <button type="button" className={styles.getStartedButton} onClick={openCatalog}>
              Get started
            </button>
          </div>
        ) : (
          CATEGORY_ORDER.map((cat) =>
            menuByCategory[cat].length > 0 ? (
              <div key={cat} className={styles.categoryGroup}>
                <h3 className={styles.categoryLabel}>{CATEGORY_LABELS[cat]}</h3>
                <div className={styles.menuGrid}>
                  {menuByCategory[cat].map((item) => (
                    <ChefMenuCard
                      key={item.id}
                      item={item}
                      onEdit={openEditForm}
                      onRemove={removeMenuItem}
                      onToggleStatus={toggleStatus}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.ordersHeader}>
          <h2 className={styles.sectionTitle}>Orders</h2>
          {pendingCount > 0 && <span className={styles.pendingBadge}>{pendingCount} pending</span>}
        </div>

        {activeOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ClipboardList size={26} strokeWidth={1.5} />
            </div>
            <h3 className={styles.emptyTitle}>No orders yet</h3>
            <p className={styles.emptyText}>Orders will show up here as customers place them.</p>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {activeOrders.map((order) => (
              <OrderQueueItem key={order.id} order={order} onConfirm={confirmOrder} />
            ))}
          </div>
        )}
      </section>

      <CatalogMealPicker
        open={catalogOpen}
        existingNames={menu.map((item) => item.name)}
        onClose={() => setCatalogOpen(false)}
        onConfirm={handleCatalogConfirm}
        onAddCustom={openCustomForm}
      />

      <MenuItemForm
        open={formOpen}
        initialItem={editingItem}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}