'use client';

import { useExampleItem } from './hooks/useExampleItem';
import { MarkdownEditor } from '@/components/MarkdownEditor/MarkdownEditor';
import { X, RefreshCw } from 'lucide-react';

interface ExampleItemProps {
  exampleId: string;
  isViewingHistory?: boolean;
}

export function ExampleItem({ exampleId, isViewingHistory = false }: ExampleItemProps) {
  const { content, type, onChange, onToggleType, onRemove } = useExampleItem(exampleId);

  const isPositive = type === 'positive';

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-b border-neutral-200">
        {isViewingHistory ? (
          <span
            className={`
              inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium
              ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            `}
          >
            {isPositive ? 'Positive' : 'Negative'}
          </span>
        ) : (
          <button
            onClick={onToggleType}
            className={`
              inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium
              transition-colors duration-150
              ${
                isPositive
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }
            `}
          >
            <RefreshCw className="h-3 w-3" />
            {isPositive ? 'Positive' : 'Negative'}
          </button>
        )}
        {!isViewingHistory && (
          <button
            onClick={onRemove}
            className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded transition-colors"
            title="Remove example"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <MarkdownEditor
        value={content}
        onChange={onChange}
        placeholder={isPositive ? 'Example of desired output...' : 'Example of output to avoid...'}
        minHeight="80px"
        borderless
        readOnly={isViewingHistory}
      />
    </div>
  );
}
