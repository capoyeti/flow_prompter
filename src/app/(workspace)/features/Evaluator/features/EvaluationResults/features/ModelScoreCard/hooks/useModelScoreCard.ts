import { useState, useCallback } from 'react';

export function useModelScoreCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return {
    isExpanded,
    toggleExpanded,
  };
}
