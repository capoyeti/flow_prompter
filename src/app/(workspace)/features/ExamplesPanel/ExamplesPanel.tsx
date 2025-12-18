'use client';

import { useState, useRef, useEffect } from 'react';
import { useExamplesPanel } from './hooks/useExamplesPanel';
import { ExampleItem } from './features/ExampleItem/ExampleItem';
import { Panel, HelpSection } from '@/components';
import { Plus, ChevronDown } from 'lucide-react';

export function ExamplesPanel() {
  const { examples, addExample, subtitle, isViewingHistory } = useExamplesPanel();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddPositive = () => {
    addExample('positive');
    setDropdownOpen(false);
  };

  const handleAddNegative = () => {
    addExample('negative');
    setDropdownOpen(false);
  };

  // Hide the add button when viewing history
  const headerActions = isViewingHistory ? null : (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center gap-1 px-2 py-1 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add
        <ChevronDown className="h-3 w-3" />
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 min-w-[140px]">
          <button
            onClick={handleAddPositive}
            className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 text-green-700 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Positive
          </button>
          <button
            onClick={handleAddNegative}
            className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 text-red-700 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Negative
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="Examples"
      subtitle={subtitle}
      collapsible
      defaultCollapsed={true}
      headerActions={headerActions}
    >
      <HelpSection title="What are Examples?">
        <div className="space-y-2">
          <p>
            <strong>What:</strong> Show the model what good and bad outputs look like. Positive examples show desired behavior; negative examples show what to avoid.
          </p>
          <p>
            <strong>Why:</strong> Few-shot examples are often more effective than lengthy instructions. Showing is better than telling - models learn patterns from examples.
          </p>
          <div className="mt-2 p-2 bg-white rounded border border-neutral-200">
            <p className="text-xs text-neutral-500 mb-1">Positive example:</p>
            <p className="text-xs italic">&quot;Thank you for reaching out! I&apos;ve processed your refund - you&apos;ll see it in 3-5 days.&quot;</p>
          </div>
          <div className="mt-1 p-2 bg-white rounded border border-neutral-200">
            <p className="text-xs text-neutral-500 mb-1">Negative example:</p>
            <p className="text-xs italic">&quot;Your request has been received. As per our policy, refunds are processed within 5-7 business days. If you have further questions, please contact support.&quot;</p>
          </div>
        </div>
      </HelpSection>
      {examples.length === 0 ? (
        <div className="text-center py-6 text-neutral-500 text-sm">
          No examples yet. Add positive or negative examples to guide the model.
        </div>
      ) : (
        <div className="space-y-3">
          {examples.map((example) => (
            <ExampleItem
              key={example.id}
              exampleId={example.id}
              isViewingHistory={isViewingHistory}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}
