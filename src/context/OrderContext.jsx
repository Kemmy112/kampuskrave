import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient'; // adjust path to match your project
import { isToday } from '../utils/dateUtils';

const OrderContext = createContext(null);

const REVOKE_AFTER_MS = 4 * 60 * 60 * 1000; // 4 hours
const DELIVERY_WINDOW_MS = 90 * 60 * 1000; // 90 minutes
const FIRST_ORDER_DISCOUNT = 0.3;

function rowToOrder(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    items: row.items || [],
    status: row.status,
    orderType: row.order_type,
    requestedDate: row.requested_date,
    isFirstOrder: row.is_first_order,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    deliveryWindowEnd: row.delivery_window_end,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
  };
}

function computeTotals(items, isFirstOrder) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = isFirstOrder ? subtotal * FIRST_ORDER_DISCOUNT : 0;
  const total = subtotal - discount;
  return { subtotal, discount, total };
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Failed to load orders:', error.message);
      } else if (isMounted) {
        setOrders(data.map(rowToOrder));
      }
      if (isMounted) setLoading(false);
    }
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((order) => order.id !== payload.old.id);
            }
            const updated = rowToOrder(payload.new);
            const idx = prev.findIndex((order) => order.id === updated.id);
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

  useEffect(() => {
    const interval = setInterval(async () => {
      const stale = ordersRef.current.filter(
        (order) =>
          order.orderType !== 'special' &&
          order.status === 'pending' &&
          Date.now() - new Date(order.createdAt).getTime() > REVOKE_AFTER_MS
      );
      if (stale.length === 0) return;

      setOrders((prev) =>
        prev.map((order) =>
          stale.some((s) => s.id === order.id) ? { ...order, status: 'revoked' } : order
        )
      );

      const { error } = await supabase
        .from('orders')
        .update({ status: 'revoked' })
        .in('id', stale.map((s) => s.id));
      if (error) {
        console.error('Failed to auto-revoke stale orders:', error.message);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function isFirstOrderFor(customerId, allOrders) {
    return !allOrders.some(
      (o) =>
        o.customerId === customerId &&
        o.status !== 'revoked' &&
        (o.status === 'confirmed' || o.status === 'acknowledged' || o.isFirstOrder)
    );
  }

  function mergeItems(existingItems, menuItem, quantity) {
    const lineIndex = existingItems.findIndex((i) => i.menuItemId === menuItem.id);
    if (lineIndex === -1) {
      return [
        ...existingItems,
        { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity },
      ];
    }
    return existingItems.map((i, idx) =>
      idx === lineIndex ? { ...i, quantity: i.quantity + quantity } : i
    );
  }

  const addOrderItem = useCallback(async (customerId, customerName, menuItem, quantity = 1) => {
    const prev = ordersRef.current;
    const existing = prev.find(
      (o) =>
        o.customerId === customerId &&
        o.status === 'pending' &&
        o.orderType !== 'special' &&
        isToday(o.createdAt)
    );

    if (existing) {
      const newItems = mergeItems(existing.items, menuItem, quantity);
      const totals = computeTotals(newItems, existing.isFirstOrder);
      const { error } = await supabase
        .from('orders')
        .update({ items: newItems, ...totals })
        .eq('id', existing.id);
      if (error) {
        console.error('Failed to update order:', error.message);
        return;
      }
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === existing.id ? { ...o, items: newItems, ...totals } : o))
      );
      return;
    }

    const isFirstOrder = isFirstOrderFor(customerId, prev);
    const items = [
      { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity },
    ];
    const totals = computeTotals(items, isFirstOrder);
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        customer_name: customerName,
        items,
        status: 'pending',
        order_type: 'immediate',
        requested_date: null,
        is_first_order: isFirstOrder,
        ...totals,
      })
      .select()
      .single();
    if (error) {
      console.error('Failed to create order:', error.message);
      return;
    }
    const newOrder = rowToOrder(data);
    setOrders((prevOrders) =>
      prevOrders.some((o) => o.id === newOrder.id) ? prevOrders : [...prevOrders, newOrder]
    );
  }, []);

  const addSpecialOrderItem = useCallback(
    async (customerId, customerName, menuItem, quantity, requestedDate) => {
      const prev = ordersRef.current;
      const existing = prev.find(
        (o) =>
          o.customerId === customerId &&
          o.status === 'pending' &&
          o.orderType === 'special' &&
          o.requestedDate === requestedDate
      );

      if (existing) {
        const newItems = mergeItems(existing.items, menuItem, quantity);
        const totals = computeTotals(newItems, existing.isFirstOrder);
        const { error } = await supabase
          .from('orders')
          .update({ items: newItems, ...totals })
          .eq('id', existing.id);
        if (error) {
          console.error('Failed to update special order:', error.message);
          return;
        }
        setOrders((prevOrders) =>
          prevOrders.map((o) => (o.id === existing.id ? { ...o, items: newItems, ...totals } : o))
        );
        return;
      }

      const isFirstOrder = isFirstOrderFor(customerId, prev);
      const items = [
        { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity },
      ];
      const totals = computeTotals(items, isFirstOrder);
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          customer_name: customerName,
          items,
          status: 'pending',
          order_type: 'special',
          requested_date: requestedDate,
          is_first_order: isFirstOrder,
          ...totals,
        })
        .select()
        .single();
      if (error) {
        console.error('Failed to create special order:', error.message);
        return;
      }
      const newOrder = rowToOrder(data);
      setOrders((prevOrders) =>
        prevOrders.some((o) => o.id === newOrder.id) ? prevOrders : [...prevOrders, newOrder]
      );
    },
    []
  );

  const confirmOrder = useCallback(async (id) => {
    const order = ordersRef.current.find((o) => o.id === id);
    if (!order) return;

    const now = new Date();
    const updates =
      order.orderType === 'special'
        ? { status: 'confirmed', confirmed_at: now.toISOString() }
        : {
            status: 'confirmed',
            confirmed_at: now.toISOString(),
            delivery_window_end: new Date(now.getTime() + DELIVERY_WINDOW_MS).toISOString(),
          };

    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) {
      console.error('Failed to confirm order:', error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: 'confirmed',
              confirmedAt: updates.confirmed_at,
              deliveryWindowEnd: updates.delivery_window_end ?? o.deliveryWindowEnd,
            }
          : o
      )
    );
  }, []);

  const revokeOrder = useCallback(async (id) => {
    const { error } = await supabase.from('orders').update({ status: 'revoked' }).eq('id', id);
    if (error) {
      console.error('Failed to revoke order:', error.message);
      return;
    }
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: 'revoked' } : order)));
  }, []);

  const acknowledgeOrder = useCallback(async (id) => {
    const { error } = await supabase.from('orders').update({ status: 'acknowledged' }).eq('id', id);
    if (error) {
      console.error('Failed to acknowledge order:', error.message);
      return;
    }
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: 'acknowledged' } : order)));
  }, []);

  const removeOrder = useCallback(async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error('Failed to remove order:', error.message);
      return;
    }
    setOrders((prev) => prev.filter((order) => order.id !== id));
  }, []);

  const value = {
    orders,
    loading,
    addOrderItem,
    addSpecialOrderItem,
    confirmOrder,
    acknowledgeOrder,
    revokeOrder,
    removeOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return ctx;
}