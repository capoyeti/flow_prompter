'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function HelpSection({ title, children, defaultExpanded = false }: HelpSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span>{title}</span>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      {isExpanded && (
        <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-sm text-neutral-600">
          {children}
        </div>
      )}
    </div>
  );
}
