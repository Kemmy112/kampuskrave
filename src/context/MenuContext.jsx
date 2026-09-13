import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';

const MenuContext = createContext(null);

function todayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function rowToMenuItem(row) {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url,
    price: Number(row.price),
    status: row.status,
    category: row.category,
    menuDate: row.menu_date,
  };
}

export function MenuProvider({ children }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchMenu() {
      await supabase.auth.getSession();

      const { data, error } = await supabase.from('meals').select('*').order('name');
      if (error) {
        console.error('Failed to load menu:', error.message);
      } else if (isMounted) {
        setMenu(data.map(rowToMenuItem));
      }
      if (isMounted) setLoading(false);
    }
    fetchMenu();

    // Realtime sync — pushes every insert/update/delete on `meals` to every
    // subscribed client, so this syncs across devices, not just tabs.
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

  const addMenuItem = useCallback(async ({ name, photoUrl, price, category = 'regular' }) => {
    const { data, error } = await supabase
      .from('meals')
      .insert({
        name,
        photo_url: photoUrl,
        price: Number(price),
        status: 'in-stock',
        category,
        menu_date: todayDateString(),
      })
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

  // True when the chef never explicitly handled yesterday's leftover menu:
  // there are dishes on the board, but none of them are dated today.
  // This is what triggers the carry-over prompt on the chef dashboard.
  const isMenuStale = useMemo(() => {
    const today = todayDateString();
    return menu.length > 0 && !menu.some((item) => item.menuDate === today);
  }, [menu]);

  // What customers should actually see — strictly today's dishes, never
  // yesterday's leftovers, regardless of what the chef has and hasn't
  // resolved yet.
  const todayMenu = useMemo(() => {
    const today = todayDateString();
    return menu.filter((item) => item.menuDate === today);
  }, [menu]);

  // Chef chooses "keep yesterday's menu" — bump every dish's date to today
  // so it counts as today's board without re-entering anything.
  const retainMenuForToday = useCallback(async () => {
    const today = todayDateString();
    const { error } = await supabase.from('meals').update({ menu_date: today }).lt('menu_date', today);
    if (error) {
      console.error('Failed to retain menu:', error.message);
      return;
    }
    setMenu((prev) => prev.map((item) => ({ ...item, menuDate: today })));
  }, []);

  // Chef closes the kitchen — used both for the manual "Close for today"
  // button and for "clear it out altogether" on the carry-over prompt.
  const clearMenu = useCallback(async () => {
    const { error } = await supabase.from('meals').delete().not('id', 'is', null);
    if (error) {
      console.error('Failed to clear menu:', error.message);
      return;
    }
    setMenu([]);
  }, []);

  function getMenuItem(id) {
    return menu.find((item) => item.id === id);
  }

  const value = {
    menu,
    todayMenu,
    isMenuStale,
    loading,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    toggleStatus,
    retainMenuForToday,
    clearMenu,
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