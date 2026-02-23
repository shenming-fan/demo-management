import React, { createContext, useContext, useState, useCallback } from 'react';

export interface TabItem {
  key: string;
  title: string;
  path: string;
}

interface TabContextType {
  tabs: TabItem[];
  activeKey: string;
  refreshKey: number;
  addTab: (tab: TabItem) => void;
  removeTab: (key: string) => string | undefined;
  setActiveKey: (key: string) => void;
  closeOther: (key: string) => void;
  closeLeft: (key: string) => void;
  closeRight: (key: string) => void;
  closeAll: () => void;
  refreshTab: () => void;
}

const DEFAULT_TAB: TabItem = { key: '/dashboard', title: '工作台', path: '/dashboard' };

const TabContext = createContext<TabContextType>(null!);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<TabItem[]>([DEFAULT_TAB]);
  const [activeKey, setActiveKey] = useState('/dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const addTab = useCallback((tab: TabItem) => {
    setTabs((prev) => {
      if (prev.some((t) => t.key === tab.key)) return prev;
      return [...prev, tab];
    });
    setActiveKey(tab.key);
  }, []);

  const removeTab = useCallback((key: string): string | undefined => {
    if (key === '/dashboard') return undefined;

    let nextActive: string | undefined;
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === key);
      const next = prev.filter((t) => t.key !== key);
      if (key === activeKey && next.length > 0) {
        nextActive = next[Math.min(idx, next.length - 1)]?.key;
      }
      return next;
    });
    return nextActive;
  }, [activeKey]);

  const closeOther = useCallback((key: string) => {
    setTabs((prev) => prev.filter((t) => t.key === '/dashboard' || t.key === key));
    setActiveKey(key);
  }, []);

  const closeLeft = useCallback((key: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === key);
      return prev.filter((t, i) => t.key === '/dashboard' || i >= idx);
    });
    setActiveKey(key);
  }, []);

  const closeRight = useCallback((key: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === key);
      return prev.filter((t, i) => t.key === '/dashboard' || i <= idx);
    });
    setActiveKey(key);
  }, []);

  const closeAll = useCallback(() => {
    setTabs([DEFAULT_TAB]);
    setActiveKey('/dashboard');
  }, []);

  const refreshTab = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <TabContext.Provider value={{ tabs, activeKey, refreshKey, addTab, removeTab, setActiveKey, closeOther, closeLeft, closeRight, closeAll, refreshTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabs = () => useContext(TabContext);
