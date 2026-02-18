import { useState, useCallback } from "react";

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((props: ToastProps) => {
    setToasts((prev) => [...prev, props]);

    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  }, []);

  return { toast, toasts };
}
