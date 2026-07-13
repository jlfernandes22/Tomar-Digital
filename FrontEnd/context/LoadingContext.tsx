import { createContext, useContext, useState } from 'react';

type LoadingCtx = {
  loadingQR: boolean;
  setLoadingQR: (v: boolean) => void;
};

const Ctx = createContext<LoadingCtx>({
  loadingQR: false,
  setLoadingQR: () => {},
});

export const useLoadingState = () => useContext(Ctx);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingQR, setLoadingQR] = useState(false);
  return (
    <Ctx.Provider value={{ loadingQR, setLoadingQR }}>{children}</Ctx.Provider>
  );
}
