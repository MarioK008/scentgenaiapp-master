import { useState, useEffect, useCallback } from "react";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  image_url?: string | null;
  brand?: string | null;
}

const MAX_ITEMS = 8;
const keyFor = (uid: string) => `scentgenai:recently_viewed:${uid}`;

export const useRecentlyViewed = (userId?: string | null) => {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    try {
      const raw = localStorage.getItem(keyFor(userId));
      if (raw) setItems(JSON.parse(raw));
      else setItems([]);
    } catch {
      setItems([]);
    }
  }, [userId]);

  const addRecentlyViewed = useCallback(
    (item: RecentlyViewedItem) => {
      if (!userId) return;
      setItems((prev) => {
        const next = [item, ...prev.filter((p) => p.id !== item.id)].slice(0, MAX_ITEMS);
        try {
          localStorage.setItem(keyFor(userId), JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [userId]
  );

  const clear = useCallback(() => {
    if (!userId) return;
    try {
      localStorage.removeItem(keyFor(userId));
    } catch {
      // ignore
    }
    setItems([]);
  }, [userId]);

  return { recentlyViewed: items, addRecentlyViewed, clear };
};

export const clearAllRecentlyViewed = () => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("scentgenai:recently_viewed:")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};
