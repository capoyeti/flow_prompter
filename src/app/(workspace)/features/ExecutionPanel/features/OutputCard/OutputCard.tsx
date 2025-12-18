'use client';

import { useState } from 'react';
import { StreamingText } from '@/components';
import type { RunDisplay } from '../../hooks/useExecutionPanel';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Brain,
  Loader2,
} from 'lucide-react';
import { getProviderCardColors } from '@/config/providers';

interface OutputCardProps {
  run: RunDisplay;
}

// Fixed card height for consistent "card" feel
const CARD_HEIGHT = 320;

export function OutputCard({ run }: OutputCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(run.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colors = getProviderCardColors(run.provider as 'openai' | 'anthropic' | 'google');

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: colors.bg,
        height: expanded ? 'auto' : CARD_HEIGHT,
        minHeight: CARD_HEIGHT,
        boxShadow: `
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 10px 15px -3px rgba(0, 0, 0, 0.15),
          0 20px 25px -5px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${colors.border}30` }}
      >
        <div className="flex items-center gap-3">
          <h3
            className="font-display font-bold text-xl tracking-tight"
            style={{ color: colors.title }}
          >
            {run.modelName}
          </h3>
          {run.status === 'streaming' && (
            <Loader2
              className="h-5 w-5 animate-spin"
              style={{ color: colors.accent }}
            />
          )}
          {run.status === 'completed' && run.latencyMs && (
            <span
              className="text-sm font-medium"
              style={{ color: colors.body, opacity: 0.5 }}
            >
              {(run.latencyMs / 1000).toFixed(1)}s
            </span>
          )}
          {run.status === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-red-400 font-medium">
              <AlertCircle className="h-4 w-4" />
              Error
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {run.thinking && (
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: showThinking ? `${colors.accent}25` : 'transparent',
                color: colors.accent,
              }}
              title="Toggle thinking"
            >
              <Brain className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!run.content}
            className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
            style={{ color: colors.body }}
            title="Copy output"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <Copy className="h-5 w-5" style={{ opacity: 0.6 }} />
            )}
          </button>
        </div>
      </div>

      {/* Thinking section (collapsible) */}
      {run.thinking && showThinking && (
        <div
          className="px-6 py-4"
          style={{
            backgroundColor: `${colors.edgeTint}80`,
            borderBottom: `1px solid ${colors.border}30`,
          }}
        >
          <div
            className="text-xs font-display font-bold uppercase tracking-wider mb-2"
            style={{ color: colors.accent }}
          >
            Thinking
          </div>
          <div
            className="text-base font-mono leading-relaxed max-h-32 overflow-auto"
            style={{ color: colors.body, opacity: 0.75 }}
          >
            {run.thinking}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`px-6 py-5 overflow-auto ${expanded ? 'max-h-[450px]' : ''}`}
        style={{
          height: expanded ? 'auto' : 'calc(100% - 70px)',
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.border}50 transparent`,
        }}
      >
        {run.status === 'error' ? (
          <div className="text-red-400 text-lg font-medium">
            {run.errorMessage || 'An error occurred'}
          </div>
        ) : (
          <div
            className="font-reading text-xl leading-[1.75] font-medium"
            style={{ color: colors.body }}
          >
            <StreamingText
              content={run.content}
              isStreaming={run.status === 'streaming'}
            />
          </div>
        )}
      </div>

      {/* Expand/collapse footer - only show if content overflows */}
      {run.content && run.content.length > 250 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-display font-semibold transition-all hover:opacity-80"
          style={{
            borderTop: `1px solid ${colors.border}30`,
            color: colors.accent,
            backgroundColor: `${colors.edgeTint}60`,
          }}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expand
            </>
          )}
        </button>
      )}
    </div>
  );
}
