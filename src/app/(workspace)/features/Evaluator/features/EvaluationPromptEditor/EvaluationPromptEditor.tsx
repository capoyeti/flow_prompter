'use client';

import { Sparkles, Edit3 } from 'lucide-react';
import { useEvaluationPromptEditor } from './hooks/useEvaluationPromptEditor';

export function EvaluationPromptEditor() {
  const {
    displayValue,
    placeholder,
    isUsingSmartDefault,
    hasIntent,
    handlePromptChange,
    handleToggleSmartDefault,
  } = useEvaluationPromptEditor();

  return (
    <div className="space-y-3">
      {/* Label and toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700">
          Evaluation Criteria
        </label>
        <button
          onClick={handleToggleSmartDefault}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
            transition-colors
            ${
              isUsingSmartDefault
                ? 'bg-violet-100 text-violet-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }
          `}
        >
          {isUsingSmartDefault ? (
            <>
              <Sparkles className="h-3 w-3" />
              Smart Default
            </>
          ) : (
            <>
              <Edit3 className="h-3 w-3" />
              Custom
            </>
          )}
        </button>
      </div>

      {/* Smart default indicator */}
      {isUsingSmartDefault && (
        <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
          {hasIntent ? (
            <p>Using your Intent field to evaluate outputs.</p>
          ) : (
            <p>No Intent set. Will evaluate against the prompt&apos;s apparent goal.</p>
          )}
        </div>
      )}

      {/* Textarea - only shown when not using smart default */}
      {!isUsingSmartDefault && (
        <textarea
          value={displayValue}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="
            w-full px-3 py-2 text-sm
            border border-neutral-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
            placeholder:text-neutral-400
            resize-none
          "
        />
      )}
    </div>
  );
}
