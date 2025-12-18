'use client';

import { useState, useCallback } from 'react';

export function useSentPromptCard(prompt: string | null) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [prompt]);

  return {
    isExpanded,
    copied,
    toggleExpanded,
    copyToClipboard,
  };
}
