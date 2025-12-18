'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '../Button/Button';

interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: ReactNode;
  headerActions?: ReactNode;
}

export function SlideOverPanel({
  isOpen,
  onClose,
  title,
  width = '40%',
  children,
  headerActions,
}: SlideOverPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/20 z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full z-50
          bg-white shadow-xl
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-over-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
          <h2
            id="slide-over-title"
            className="text-sm font-semibold text-neutral-900"
          >
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {headerActions}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<X className="h-4 w-4" />}
              aria-label="Close panel"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
