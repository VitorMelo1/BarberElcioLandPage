import { createContext, useContext, useState, type ReactNode } from "react";

interface BookingCtx {
  open: boolean;
  openBooking: () => void;
  closeBooking: () => void;
}

const Ctx = createContext<BookingCtx | null>(null);

export function useBooking() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking deve ser usado dentro de <BookingProvider>");
  return ctx;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open, openBooking: () => setOpen(true), closeBooking: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  );
}
