// src/components/ui/Modal.jsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Framer Motion modal with backdrop blur.
 * Usage: <Modal open={bool} onClose={fn} title="...">content</Modal>
 */
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md', className = '' }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative w-full ${maxWidth} rounded-2xl ${className}`}
            style={{
              background: 'rgba(15,21,19,0.97)',
              border: '1px solid rgba(34,48,43,0.9)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold top accent */}
            <div
              className="absolute inset-x-8 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }}
            />

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-text-faint transition hover:bg-panel2 hover:text-text"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Close button when no title */}
            {!title && onClose && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-text-faint transition hover:bg-panel2 hover:text-text"
              >
                <X size={16} />
              </button>
            )}

            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
