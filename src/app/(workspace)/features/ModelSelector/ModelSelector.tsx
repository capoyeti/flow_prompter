'use client';

import { useModelSelector } from './hooks/useModelSelector';
import { Panel } from '@/components';
import { Check, Sparkles, Settings } from 'lucide-react';
import { getModelById } from '@/config/providers';

export function ModelSelector() {
  const { modelsByProvider, selectedModelIds, toggleModel, onAddApiKey, isLoading } = useModelSelector();

  const selectedModelNames = selectedModelIds
    .map((id) => getModelById(id)?.displayName)
    .filter(Boolean)
    .join(', ');

  const hasProviders = Object.keys(modelsByProvider).length > 0;

  return (
    <Panel
      title="Models"
      subtitle={selectedModelNames || 'None selected'}
      collapsible
      defaultCollapsed={true}
    >
      {isLoading ? (
        <div className="py-4 text-center text-sm text-neutral-500">
          Loading providers...
        </div>
      ) : !hasProviders ? (
        <div className="py-4 text-center">
          <p className="text-sm text-neutral-600 mb-3">
            No models available. Configure API keys to enable models.
          </p>
          <button
            onClick={onAddApiKey}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-md transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configure Providers
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(modelsByProvider).map(([provider, models]) => {
            return (
              <div key={provider}>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                  {provider}
                </h4>
                <div className="space-y-1">
                  {models.map((model) => {
                    const isSelected = selectedModelIds.includes(model.id);
                    return (
                      <button
                        key={model.id}
                        onClick={() => toggleModel(model.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                          transition-colors duration-150
                          ${
                            isSelected
                              ? 'bg-violet-500/15 border border-violet-400/50'
                              : 'bg-black/5 border border-transparent hover:bg-black/10'
                          }
                        `}
                      >
                        <div
                          className={`
                            w-4 h-4 rounded border flex items-center justify-center
                            ${
                              isSelected
                                ? 'bg-violet-600 border-violet-600'
                                : 'border-neutral-300'
                            }
                          `}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">
                            {model.displayName}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {model.capabilities.supportsThinking && (
                            <span title="Supports thinking/reasoning">
                              <Sparkles className="h-3 w-3 text-purple-500" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
