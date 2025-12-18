'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PanelProps {
  title?: string;
  titlePlaceholder?: string;
  onTitleChange?: (title: string) => void;
  subtitle?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  headerActions?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Panel({
  title,
  titlePlaceholder = 'Untitled',
  onTitleChange,
  subtitle,
  children,
  collapsible = false,
  defaultCollapsed = false,
  headerActions,
  className = '',
  contentClassName = '',
}: PanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const hasHeader = title !== undefined || onTitleChange || headerActions;

  return (
    <div
      className={`
        bg-white border border-neutral-200 rounded-lg shadow-sm
        ${className}
      `}
    >
      {hasHeader && (
        <div
          className={`
            flex items-center justify-between px-4 py-3
            ${collapsible ? 'cursor-pointer select-none' : ''}
            ${!isCollapsed && children ? 'border-b border-neutral-200' : ''}
          `}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <div className="flex items-center gap-2">
            {collapsible && (
              <span className="text-neutral-400">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            )}
            <div>
              {onTitleChange ? (
                <input
                  type="text"
                  value={title ?? ''}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder={titlePlaceholder}
                  className="text-sm font-semibold text-neutral-900 bg-transparent border-none outline-none
                             placeholder:text-neutral-400 focus:ring-0 p-0 w-auto min-w-[100px]"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : title ? (
                <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
              ) : null}
              {isCollapsed && subtitle && (
                <div className="text-xs text-neutral-500 mt-0.5">{subtitle}</div>
              )}
            </div>
          </div>
          {headerActions && (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {headerActions}
            </div>
          )}
        </div>
      )}
      {(!collapsible || !isCollapsed) && (
        <div className={`p-4 ${contentClassName}`}>{children}</div>
      )}
    </div>
  );
}
