import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { sfx } from '../../lib/soundEngine';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideCloseButton?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/** Cinematic modal — portal-rendered, spring-in, focus-trap friendly. */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  hideCloseButton = false,
  footer,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sfx('kbd.esc');
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) sfx('modal.open');
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              sfx('modal.close');
              onClose();
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={[
              'relative w-full glass-heavy rounded-2xl border border-border-subtle shadow-2xl overflow-hidden',
              SIZE_CLASSES[size],
            ].join(' ')}
            initial={{ opacity: 0, scale: 0.93, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            {/* top brand hairline */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
            {(title || icon) && (
              <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border-subtle">
                {icon && <div className="p-2 rounded-xl bg-accent/12 text-accent border border-accent/25">{icon}</div>}
                <div className="min-w-0 flex-1">
                  {title && <h3 className="text-base font-bold text-white leading-tight">{title}</h3>}
                  {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
                </div>
                {!hideCloseButton && (
                  <button
                    onClick={() => {
                      sfx('modal.close');
                      onClose();
                    }}
                    onMouseEnter={() => sfx('ui.hover.03')}
                    className="p-1.5 -m-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.07] transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
            {footer && (
              <div className="px-6 py-4 border-t border-border-subtle bg-black/20 flex items-center justify-end gap-2.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
