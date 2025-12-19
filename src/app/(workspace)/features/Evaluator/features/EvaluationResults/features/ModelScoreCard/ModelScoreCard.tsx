'use client';

import { ChevronDown, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useModelScoreCard } from './hooks/useModelScoreCard';
import type { EvaluationResult } from '@/types/models';
import type { ProviderType } from '@/config/providers';
import { getProviderCardColors, getModelById } from '@/config/providers';

interface ModelScoreCardProps {
  result: EvaluationResult;
}

function getScoreColor(score: number): { text: string; bg: string; ring: string } {
  if (score >= 80) {
    return {
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/50',
      ring: 'ring-green-200 dark:ring-green-700',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      ring: 'ring-emerald-200 dark:ring-emerald-700',
    };
  }
  if (score >= 40) {
    return {
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      ring: 'ring-amber-200 dark:ring-amber-700',
    };
  }
  if (score >= 20) {
    return {
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/50',
      ring: 'ring-orange-200 dark:ring-orange-700',
    };
  }
  return {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50',
    ring: 'ring-red-200 dark:ring-red-700',
  };
}

export function ModelScoreCard({ result }: ModelScoreCardProps) {
  const { isExpanded, toggleExpanded } = useModelScoreCard();

  const modelConfig = getModelById(result.modelId);
  const provider = (modelConfig?.provider || 'anthropic') as ProviderType;
  const modelName = modelConfig?.displayName || result.modelId;
  const colors = getProviderCardColors(provider);
  const scoreColors = getScoreColor(result.score);

  return (
    <div
      onClick={toggleExpanded}
      className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg shadow-md"
      style={{ border: `2px solid ${colors.border}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          )}
          <h3
            className="font-semibold text-base"
            style={{ color: colors.title }}
          >
            {modelName}
          </h3>
        </div>

        {/* Score badge */}
        <div
          className={`
            px-3 py-1 rounded-full text-lg font-bold ring-2
            ${scoreColors.text} ${scoreColors.bg} ${scoreColors.ring}
          `}
        >
          {result.score}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-neutral-100 dark:border-neutral-700">
          {/* Reasoning */}
          <div className="px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
              Reasoning
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {result.reasoning}
            </p>
          </div>

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <div className="px-4 py-3 bg-green-50/50 dark:bg-green-950/30 border-t border-neutral-100 dark:border-neutral-700">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-2">
                <ThumbsUp className="h-3.5 w-3.5" />
                Strengths
              </div>
              <ul className="space-y-1">
                {result.strengths.map((strength, i) => (
                  <li key={i} className="text-sm text-green-800 dark:text-green-300 flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-1">+</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {result.weaknesses && result.weaknesses.length > 0 && (
            <div className="px-4 py-3 bg-red-50/50 dark:bg-red-950/30 border-t border-neutral-100 dark:border-neutral-700">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 mb-2">
                <ThumbsDown className="h-3.5 w-3.5" />
                Weaknesses
              </div>
              <ul className="space-y-1">
                {result.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
                    <span className="text-red-500 dark:text-red-400 mt-1">-</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Collapsed preview */}
      {!isExpanded && (
        <div className="px-4 pb-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {result.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
