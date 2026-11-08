import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { X } from 'lucide-react';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showCloseButton?: boolean;
  showGrabHandle?: boolean;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  headerContent?: React.ReactNode;
}

const MAX_WIDTH_CLASSES: Record<NonNullable<BaseModalProps['maxWidth']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  full: 'sm:max-w-5xl',
};

export function BaseModal({
  isOpen,
  onClose,
  children,
  title,
  icon,
  subtitle,
  maxWidth = 'xl',
  showCloseButton = true,
  showGrabHandle = true,
  className = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventScroll = true,
  headerContent,
}: BaseModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  // Client hydration check for Portal
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen || !preventScroll || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, preventScroll]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  // Mobile Bottom Sheet Variants vs Desktop Centered Modal Variants
  const modalVariants: Variants = isMobile
    ? {
        hidden: { y: '100%', opacity: 0.9 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: 'spring' as const, damping: 28, stiffness: 320 },
        },
        exit: {
          y: '100%',
          opacity: 0.85,
          transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
        },
      }
    : {
        hidden: { scale: 0.94, opacity: 0, y: 10 },
        visible: {
          scale: 1,
          opacity: 1,
          y: 0,
          transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
        },
        exit: {
          scale: 0.95,
          opacity: 0,
          y: 8,
          transition: { duration: 0.16, ease: [0.32, 0.72, 0, 1] },
        },
      };

  const portalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
        >
          {/* Backdrop Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm -z-10"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${MAX_WIDTH_CLASSES[maxWidth]} bg-gradient-to-b from-amber-50/95 via-white to-rose-50/60 border border-amber-200/80 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden text-slate-800 ${className}`}
          >
            {/* Mobile Grab Handle */}
            {showGrabHandle && (
              <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
                <div className="w-12 h-1.5 bg-amber-300/80 rounded-full" />
              </div>
            )}

            {/* Modal Header */}
            {(title || headerContent || showCloseButton) && (
              <div className="flex items-center justify-between px-5 sm:px-6 pt-3 sm:pt-5 pb-3 border-b border-amber-200/60 shrink-0">
                {headerContent ? (
                  headerContent
                ) : (
                  <div className="flex items-center gap-3">
                    {icon && (
                      <span className="p-2 rounded-2xl bg-amber-400 text-amber-950 font-bold text-lg shadow-xs flex items-center justify-center shrink-0">
                        {icon}
                      </span>
                    )}
                    <div>
                      {subtitle && (
                        <span className="text-[10px] font-mono tracking-wider font-bold text-amber-800 uppercase block">
                          {subtitle}
                        </span>
                      )}
                      {title && (
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                          {title}
                        </h2>
                      )}
                    </div>
                  </div>
                )}

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer"
                    title="ปิดหน้าต่าง"
                    aria-label="ปิดหน้าต่าง"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Modal Body / Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(portalContent, document.body);
}
