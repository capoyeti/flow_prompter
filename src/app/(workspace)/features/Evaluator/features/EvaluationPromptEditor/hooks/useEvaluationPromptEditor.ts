import { useCallback, useMemo } from 'react';
import { useEvaluatorStore, useExecutionStore } from '@/stores';
import { buildSmartDefaultPrompt, getEvaluationPreview } from '../../../utils/buildEvaluationPrompt';

export function useEvaluationPromptEditor() {
  const {
    evaluationPrompt,
    isUsingSmartDefault,
    setEvaluationPrompt,
    toggleSmartDefault,
  } = useEvaluatorStore();

  const { promptIntent } = useExecutionStore();

  // Get the smart default prompt based on intent
  const smartDefaultPrompt = useMemo(
    () => buildSmartDefaultPrompt(promptIntent),
    [promptIntent]
  );

  // Get the preview of what will actually be used
  const previewPrompt = useMemo(
    () => getEvaluationPreview(promptIntent, isUsingSmartDefault ? undefined : evaluationPrompt),
    [promptIntent, isUsingSmartDefault, evaluationPrompt]
  );

  // Handler for changing the evaluation prompt
  const handlePromptChange = useCallback(
    (value: string) => {
      setEvaluationPrompt(value);
    },
    [setEvaluationPrompt]
  );

  // Handler for toggling smart default
  const handleToggleSmartDefault = useCallback(() => {
    toggleSmartDefault();
  }, [toggleSmartDefault]);

  // Determine what to show in the textarea
  const displayValue = isUsingSmartDefault ? '' : evaluationPrompt;
  const placeholder = isUsingSmartDefault
    ? smartDefaultPrompt
    : 'Enter your evaluation criteria...';

  return {
    displayValue,
    placeholder,
    isUsingSmartDefault,
    hasIntent: !!promptIntent?.trim(),
    previewPrompt,
    handlePromptChange,
    handleToggleSmartDefault,
  };
}
