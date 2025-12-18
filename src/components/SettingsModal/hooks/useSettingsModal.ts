'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/stores';
import type { ProviderType } from '@/config/providers';

interface ApiKeyField {
  provider: ProviderType;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
}

export function useSettingsModal() {
  const {
    apiKeys,
    isSettingsModalOpen,
    hasCompletedOnboarding,
    setApiKey,
    closeSettingsModal,
    completeOnboarding,
    loadFromStorage,
  } = useSettingsStore();

  // Local form state for editing
  const [formKeys, setFormKeys] = useState<Record<ProviderType, string>>({
    openai: '',
    anthropic: '',
    google: '',
  });

  // Visibility toggle for each field
  const [visibility, setVisibility] = useState<Record<ProviderType, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
  });

  // Initialize store from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Sync form state when modal opens
  useEffect(() => {
    if (isSettingsModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormKeys({
        openai: apiKeys.openai,
        anthropic: apiKeys.anthropic,
        google: apiKeys.google,
      });
      // Reset visibility on open
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibility({
        openai: false,
        anthropic: false,
        google: false,
      });
    }
  }, [isSettingsModalOpen, apiKeys]);

  const updateFormKey = useCallback((provider: ProviderType, value: string) => {
    setFormKeys((prev) => ({ ...prev, [provider]: value }));
  }, []);

  const toggleVisibility = useCallback((provider: ProviderType) => {
    setVisibility((prev) => ({ ...prev, [provider]: !prev[provider] }));
  }, []);

  const handleSave = useCallback(() => {
    // Save all keys to store (which persists to localStorage)
    setApiKey('openai', formKeys.openai);
    setApiKey('anthropic', formKeys.anthropic);
    setApiKey('google', formKeys.google);

    // Mark onboarding complete if this is first time
    if (!hasCompletedOnboarding) {
      completeOnboarding();
    }

    closeSettingsModal();
  }, [formKeys, setApiKey, hasCompletedOnboarding, completeOnboarding, closeSettingsModal]);

  const handleCancel = useCallback(() => {
    // Reset form to current stored values
    setFormKeys({
      openai: apiKeys.openai,
      anthropic: apiKeys.anthropic,
      google: apiKeys.google,
    });
    closeSettingsModal();
  }, [apiKeys, closeSettingsModal]);

  // Build field configuration
  const fields: ApiKeyField[] = [
    {
      provider: 'openai',
      label: 'OpenAI',
      placeholder: 'sk-...',
      value: formKeys.openai,
      visible: visibility.openai,
    },
    {
      provider: 'anthropic',
      label: 'Anthropic',
      placeholder: 'sk-ant-...',
      value: formKeys.anthropic,
      visible: visibility.anthropic,
    },
    {
      provider: 'google',
      label: 'Google',
      placeholder: 'AIza...',
      value: formKeys.google,
      visible: visibility.google,
    },
  ];

  // Determine if this is the welcome/onboarding flow
  const isWelcomeMode = !hasCompletedOnboarding;

  return {
    isOpen: isSettingsModalOpen,
    isWelcomeMode,
    fields,
    updateFormKey,
    toggleVisibility,
    handleSave,
    handleCancel,
  };
}
