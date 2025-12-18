'use client';

import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useSentPromptCard } from './hooks/useSentPromptCard';

interface SentPromptCardProps {
  prompt: string | null;
}

export function SentPromptCard({ prompt }: SentPromptCardProps) {
  const { isExpanded, copied, toggleExpanded, copyToClipboard } = useSentPromptCard(prompt);

  if (!prompt) return null;

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden">
      <div
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-100 transition-colors cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          )}
          <span className="text-sm font-medium text-neutral-700">Sent Prompt</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard();
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded transition-colors"
          title="Copy full prompt"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4">
          <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-mono bg-white border border-neutral-200 rounded p-3 max-h-64 overflow-y-auto">
            {prompt}
          </pre>
        </div>
      )}
    </div>
  );
}
