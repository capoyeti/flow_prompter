'use client';

import { useCallback } from 'react';
import { useExecutionStore } from '@/stores';

export function useExampleItem(exampleId: string) {
  const { promptExamples, updateExample, removeExample, toggleExampleType } = useExecutionStore();

  const example = promptExamples.find((ex) => ex.id === exampleId);

  const handleChange = useCallback(
    (content: string) => {
      updateExample(exampleId, content);
    },
    [exampleId, updateExample]
  );

  const handleToggleType = useCallback(() => {
    toggleExampleType(exampleId);
  }, [exampleId, toggleExampleType]);

  const handleRemove = useCallback(() => {
    removeExample(exampleId);
  }, [exampleId, removeExample]);

  return {
    content: example?.content ?? '',
    type: example?.type ?? 'positive',
    onChange: handleChange,
    onToggleType: handleToggleType,
    onRemove: handleRemove,
  };
}
