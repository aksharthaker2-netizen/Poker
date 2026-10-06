// src/components/ui/ToastContext.jsx
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, Star, X } from 'lucide-react';

const ToastCtx = createContext(null);

const ICONS = {
  success:     <CheckCircle size={16} className="text-success shrink-0 mt-0.5" />,
  error:       <XCircle    size={16} className="text-danger shrink-0 mt-0.5" />,
  info:        <Info       size={16} className="text-gold shrink-0 mt-0.5" />,
  achievement: <Star       size={16} className="text-gold shrink-0 mt-0.5" />,
};

function Toast({ id, type = 'info', title, message, onClose }) {
  const typeClass = `toast toast-${type}`;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={typeClass}
    >
      {ICONS[type]}
      <div className="flex-1 min-w-0">
        {title && <p className="text-[13px] font-semibold text-text">{title}</p>}
        {message && <p className="text-[12px] text-text-muted mt-0.5 leading-snug">{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="shrink-0 rounded-md p-0.5 text-text-faint transition hover:text-text"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div className="toast-container">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/** Hook to show toasts from any component */
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
