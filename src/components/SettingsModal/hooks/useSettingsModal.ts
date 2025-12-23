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
  serverConfigured: boolean;
}

export function useSettingsModal() {
  const {
    apiKeys,
    serverConfiguredProviders,
    isSettingsModalOpen,
    hasCompletedOnboarding,
    setApiKey,
    closeSettingsModal,
    completeOnboarding,
    loadFromStorage,
    fetchServerProviders,
  } = useSettingsStore();

  // Local form state for editing
  const [formKeys, setFormKeys] = useState<Record<ProviderType, string>>({
    openai: '',
    anthropic: '',
    google: '',
    mistral: '',
    deepseek: '',
    perplexity: '',
    ollama: '',
  });

  // Visibility toggle for each field
  const [visibility, setVisibility] = useState<Record<ProviderType, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
    mistral: false,
    deepseek: false,
    perplexity: false,
    ollama: false,
  });

  // Initialize store from localStorage and fetch server providers on mount
  useEffect(() => {
    loadFromStorage();
    fetchServerProviders();
  }, [loadFromStorage, fetchServerProviders]);

  // Sync form state when modal opens
  useEffect(() => {
    if (isSettingsModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormKeys({
        openai: apiKeys.openai,
        anthropic: apiKeys.anthropic,
        google: apiKeys.google,
        mistral: apiKeys.mistral,
        deepseek: apiKeys.deepseek,
        perplexity: apiKeys.perplexity,
        ollama: apiKeys.ollama,
      });
      // Reset visibility on open
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibility({
        openai: false,
        anthropic: false,
        google: false,
        mistral: false,
        deepseek: false,
        perplexity: false,
        ollama: false,
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
    setApiKey('mistral', formKeys.mistral);
    setApiKey('deepseek', formKeys.deepseek);
    setApiKey('perplexity', formKeys.perplexity);
    setApiKey('ollama', formKeys.ollama);

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
      mistral: apiKeys.mistral,
      deepseek: apiKeys.deepseek,
      perplexity: apiKeys.perplexity,
      ollama: apiKeys.ollama,
    });
    closeSettingsModal();
  }, [apiKeys, closeSettingsModal]);

  // Helper to check if provider has server-side key
  const isServerConfigured = (provider: ProviderType) =>
    serverConfiguredProviders.includes(provider);

  // Build field configuration
  const fields: ApiKeyField[] = [
    {
      provider: 'openai',
      label: 'OpenAI',
      placeholder: 'sk-...',
      value: formKeys.openai,
      visible: visibility.openai,
      serverConfigured: isServerConfigured('openai'),
    },
    {
      provider: 'anthropic',
      label: 'Anthropic',
      placeholder: 'sk-ant-...',
      value: formKeys.anthropic,
      visible: visibility.anthropic,
      serverConfigured: isServerConfigured('anthropic'),
    },
    {
      provider: 'google',
      label: 'Google',
      placeholder: 'AIza...',
      value: formKeys.google,
      visible: visibility.google,
      serverConfigured: isServerConfigured('google'),
    },
    {
      provider: 'mistral',
      label: 'Mistral',
      placeholder: 'Enter Mistral API key',
      value: formKeys.mistral,
      visible: visibility.mistral,
      serverConfigured: isServerConfigured('mistral'),
    },
    {
      provider: 'deepseek',
      label: 'DeepSeek',
      placeholder: 'sk-...',
      value: formKeys.deepseek,
      visible: visibility.deepseek,
      serverConfigured: isServerConfigured('deepseek'),
    },
    {
      provider: 'perplexity',
      label: 'Perplexity',
      placeholder: 'pplx-...',
      value: formKeys.perplexity,
      visible: visibility.perplexity,
      serverConfigured: isServerConfigured('perplexity'),
    },
    {
      provider: 'ollama',
      label: 'Ollama (Local)',
      placeholder: 'http://localhost:11434',
      value: formKeys.ollama,
      visible: visibility.ollama,
      serverConfigured: isServerConfigured('ollama'),
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
