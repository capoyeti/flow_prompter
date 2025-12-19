'use client';

import { useCallback, useRef, useState } from 'react';
import { useExecutionStore, selectCanExecute, useSettingsStore, resetWorkspace } from '@/stores';
import { useExecutePrompt } from '../../../../../hooks/useExecutePrompt';
import { buildExportData, downloadExport } from '@/utils/exportImport/exportPrompt';
import { importFromFile, ParsedImportData } from '@/utils/exportImport/importPrompt';
import type { Prompt } from '@/types/models';

export function useNavActions() {
  const {
    currentPrompt,
    isExecuting,
    setCurrentPrompt,
    promptIntent,
    setIntent,
    promptGuardrails,
    setGuardrails,
    promptExamples,
    setExamples,
    completedRuns,
    historyViewIndex,
    restoreHistoryVersion,
  } = useExecutionStore();
  const canExecute = useExecutionStore(selectCanExecute);
  const { executeAll } = useExecutePrompt();
  const { openSettingsModal } = useSettingsStore();

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Run button click
  const handleRun = useCallback(() => {
    if (canExecute) {
      // If viewing history, restore all parts from that snapshot first
      const isViewingHistory = historyViewIndex >= 0;
      if (isViewingHistory) {
        restoreHistoryVersion(historyViewIndex);
      }
      executeAll();
    }
  }, [canExecute, executeAll, historyViewIndex, restoreHistoryVersion]);

  // Handle Export button click
  const handleExport = useCallback(() => {
    if (!currentPrompt) return;

    const exportData = buildExportData({
      promptName: currentPrompt.name,
      promptContent: currentPrompt.contentMarkdown,
      promptIntent: promptIntent || undefined,
      promptGuardrails: promptGuardrails || undefined,
      promptExamples: promptExamples.length > 0 ? promptExamples : undefined,
      completedRuns,
    });

    downloadExport(exportData);
  }, [currentPrompt, promptIntent, promptGuardrails, promptExamples, completedRuns]);

  // Trigger file input for import
  const handleImportClick = useCallback(() => {
    setImportError(null);
    fileInputRef.current?.click();
  }, []);

  // Apply imported data to the store
  const applyImportData = useCallback((data: ParsedImportData) => {
    // Reset everything first
    resetWorkspace();

    // Now apply imported data on top of fresh state
    const newPrompt: Prompt = {
      id: 'temp-' + Date.now(),
      projectId: '',
      name: data.promptName,
      contentMarkdown: data.promptContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentPrompt(newPrompt);

    // Set intent if provided
    if (data.promptIntent) {
      setIntent(data.promptIntent);
    }

    // Set guardrails if provided
    if (data.promptGuardrails) {
      setGuardrails(data.promptGuardrails);
    }

    // Set examples if provided
    if (data.promptExamples && data.promptExamples.length > 0) {
      setExamples(data.promptExamples);
    }
  }, [setCurrentPrompt, setIntent, setGuardrails, setExamples]);

  // Handle file selection for import
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const result = await importFromFile(file);

      if (!result.success || !result.data) {
        setImportError(result.error || 'Failed to import file');
        return;
      }

      applyImportData(result.data);
    } catch (error) {
      setImportError('Unexpected error during import');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      // Reset input so the same file can be selected again
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [applyImportData]);

  // Handle Settings button click
  const handleOpenSettings = useCallback(() => {
    openSettingsModal();
  }, [openSettingsModal]);

  // Handle New Prompt - reset to fresh state
  const handleNewPrompt = useCallback(() => {
    resetWorkspace();
  }, []);

  return {
    // Run
    canExecute,
    isExecuting,
    onRun: handleRun,

    // Export
    onExport: handleExport,
    canExport: Boolean(currentPrompt),

    // Import
    onImportClick: handleImportClick,
    onFileSelect: handleFileSelect,
    isImporting,
    importError,
    fileInputRef,

    // Settings
    onOpenSettings: handleOpenSettings,

    // New Prompt
    onNewPrompt: handleNewPrompt,
  };
}
