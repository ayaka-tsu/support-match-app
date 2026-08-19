"use client";

import { createContext, useContext, useState } from "react";

type Store = {
  id: string;
  name: string;
  address: string | null;
};

type StoreContextType = {
  selectedStore: Store | null;
  setSelectedStore: React.Dispatch<React.SetStateAction<Store | null>>;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  return (
    <StoreContext.Provider value={{ selectedStore, setSelectedStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }

  return context;
}
