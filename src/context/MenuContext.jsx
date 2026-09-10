import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient'; // adjust path to match your project

const MenuContext = createContext(null);

function rowToMenuItem(row) {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url,
    price: Number(row.price),
    status: row.status,
    category: row.category,
  };
}

export function MenuProvider({ children }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchMenu() {
      const { data, error } = await supabase.from('meals').select('*').order('name');
      if (error) {
        console.error('Failed to load menu:', error.message);
      } else if (isMounted) {
        setMenu(data.map(rowToMenuItem));
      }
      if (isMounted) setLoading(false);
    }
    fetchMenu();

    // Realtime sync — this replaces the old cross-tab localStorage 'storage'
    // event listener. Supabase pushes every insert/update/delete on `meals`
    // to every subscribed client, so this now syncs across devices too,
    // not just tabs in the same browser.
    const channel = supabase
      .channel('meals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meals' },
        (payload) => {
          setMenu((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((item) => item.id !== payload.old.id);
            }
            const updated = rowToMenuItem(payload.new);
            const idx = prev.findIndex((item) => item.id === updated.id);
            if (idx === -1) return [...prev, updated];
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Optimistically updates local state too, on top of the realtime push,
  // so the person who made the change sees it instantly rather than
  // waiting on the round trip back from Supabase.
  const addMenuItem = useCallback(async ({ name, photoUrl, price, category = 'regular' }) => {
    const { data, error } = await supabase
      .from('meals')
      .insert({ name, photo_url: photoUrl, price: Number(price), status: 'in-stock', category })
      .select()
      .single();

    if (error) {
      console.error('Failed to add menu item:', error.message);
      return null;
    }

    const newItem = rowToMenuItem(data);
    setMenu((prev) => (prev.some((i) => i.id === newItem.id) ? prev : [...prev, newItem]));
    return newItem;
  }, []);

  const updateMenuItem = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if ('name' in updates) dbUpdates.name = updates.name;
    if ('photoUrl' in updates) dbUpdates.photo_url = updates.photoUrl;
    if ('price' in updates) dbUpdates.price = Number(updates.price);
    if ('status' in updates) dbUpdates.status = updates.status;
    if ('category' in updates) dbUpdates.category = updates.category;

    const { error } = await supabase.from('meals').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('Failed to update menu item:', error.message);
      return;
    }
    setMenu((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const removeMenuItem = useCallback(async (id) => {
    const { error } = await supabase.from('meals').delete().eq('id', id);
    if (error) {
      console.error('Failed to remove menu item:', error.message);
      return;
    }
    setMenu((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleStatus = useCallback(
    async (id) => {
      const item = menu.find((i) => i.id === id);
      if (!item) return;
      const newStatus = item.status === 'in-stock' ? 'sold-out' : 'in-stock';
      await updateMenuItem(id, { status: newStatus });
    },
    [menu, updateMenuItem]
  );

  function getMenuItem(id) {
    return menu.find((item) => item.id === id);
  }

  const value = {
    menu,
    loading,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    toggleStatus,
    getMenuItem,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return ctx;
}