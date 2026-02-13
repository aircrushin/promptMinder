'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Settings2, Eye, EyeOff, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import providerOptions from './providerOptions.json';
import { useLanguage } from '@/contexts/LanguageContext';

const CUSTOM_MODEL_OPTION = { value: 'custom', label: 'Custom Model...' };
const DEFAULT_CUSTOM_ENDPOINT_OPTION = { value: 'custom', label: 'Custom Endpoint...', url: '' };
const PROVIDER_OPTIONS = providerOptions;

export function PlaygroundSettings({ settings, onSettingsChange }: { settings: any; onSettingsChange: (settings: any) => void }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const pg: Record<string, any> = (t as any)?.playground || {};
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [customModel, setCustomModel] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [providerStatuses, setProviderStatuses] = useState({});
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isManagingKey, setIsManagingKey] = useState(false);
  const [providerKeyInput, setProviderKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  const formatMessage = useCallback((template, values = {}) => {
    if (!template) return '';
    return Object.entries(values).reduce(
      (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
      template
    );
  }, []);

  const updateSetting = (key, value) => {
    onSettingsChange((prev) => ({ ...prev, [key]: value }));
  };

  const customModelOption = useMemo(
    () => ({ ...CUSTOM_MODEL_OPTION, label: pg.customModelOption || CUSTOM_MODEL_OPTION.label }),
    [pg.customModelOption]
  );
  const customEndpointOption = useMemo(
    () => ({
      ...DEFAULT_CUSTOM_ENDPOINT_OPTION,
      label: pg.customEndpointOption || DEFAULT_CUSTOM_ENDPOINT_OPTION.label,
    }),
    [pg.customEndpointOption]
  );

  const selectedProvider = settings.provider || 'openai';
  const selectedProviderConfig =
    PROVIDER_OPTIONS.find((option) => option.value === selectedProvider) ||
    PROVIDER_OPTIONS[0];
  const providerEndpoints = selectedProviderConfig?.endpoints || [];
  const endpointOptions = providerEndpoints.some((endpoint) => endpoint.value === 'custom')
    ? providerEndpoints
    : [...providerEndpoints, customEndpointOption];
  const providerModels = selectedProviderConfig?.models || [];
  const modelOptions = [...providerModels, customModelOption];

  const providerStatus = providerStatuses[selectedProvider];
  const canUseStoredCredential = Boolean(providerStatus?.connected);

  const loadProviderStatuses = useCallback(async () => {
    setIsLoadingProviders(true);
    try {
      const response = await fetch('/api/provider-keys');
      if (!response.ok) {
        throw new Error(pg.loadCredentialError || 'Failed to load provider credentials');
      }
      const payload = await response.json();
      const nextStatuses = {};
      (payload.providers || []).forEach((item) => {
        nextStatuses[item.provider] = item;
      });
      setProviderStatuses(nextStatuses);
    } catch (error) {
      console.error('Provider credential fetch error:', error);
    } finally {
      setIsLoadingProviders(false);
    }
  }, [pg]);

  useEffect(() => {
    loadProviderStatuses();
  }, [loadProviderStatuses]);

  useEffect(() => {
    if (selectedProvider === 'custom') return;

    const hasPresetMatch = providerEndpoints.some(
      (endpoint) => endpoint.url === settings.baseURL && endpoint.value !== 'custom'
    );

    if (!hasPresetMatch) {
      setCustomEndpoint('');
      const fallbackBase =
        providerEndpoints[0]?.url || selectedProviderConfig?.baseURL || '';
      updateSetting('baseURL', fallbackBase);
    }
  }, [providerEndpoints, selectedProvider, selectedProviderConfig, settings.baseURL]);

  useEffect(() => {
    if (isLoadingProviders) return;
    if (!canUseStoredCredential && settings.useStoredKey) {
      updateSetting('useStoredKey', false);
    }
  }, [canUseStoredCredential, isLoadingProviders, settings.useStoredKey]);

  useEffect(() => {
    setIsManagingKey(false);
    setProviderKeyInput('');
  }, [selectedProvider]);

  const handleModelChange = (value) => {
    if (value === 'custom') {
      setCustomModel(settings.model);
      return;
    }
    setCustomModel('');
    updateSetting('model', value);
  };

  const handleEndpointChange = (value) => {
    if (value === 'custom') {
      setCustomEndpoint(settings.baseURL || '');
      return;
    }

    setCustomEndpoint('');
    const preset = endpointOptions.find((endpoint) => endpoint.value === value);
    updateSetting('baseURL', preset?.url || '');
  };

  const isCustomModel =
    customModel !== '' ||
    !settings.model ||
    !providerModels.some((m) => m.value === settings.model);

  const isCustomEndpoint = (() => {
    if (customEndpoint !== '') return true;
    const preset = endpointOptions.find(
      (endpoint) => endpoint.url === settings.baseURL && endpoint.value !== 'custom'
    );
    return !preset;
  })();

  const endpointSelectValue = (() => {
    if (customEndpoint !== '') return 'custom';
    const preset = endpointOptions.find(
      (endpoint) => endpoint.url === settings.baseURL && endpoint.value !== 'custom'
    );
    if (preset) return preset.value;
    return 'custom';
  })();

  const handleProviderChange = (value) => {
    setCustomEndpoint('');
    
    // Find the configuration for the new provider
    const newProviderConfig = PROVIDER_OPTIONS.find((option) => option.value === value);
    
    // Automatically select the first model if available
    let newModel = settings.model;
    if (newProviderConfig?.models?.length > 0) {
      newModel = newProviderConfig.models[0].value;
    }

    onSettingsChange((prev) => ({
      ...prev,
      provider: value,
      model: newModel,
      useStoredKey: false
    }));
  };

  const handleSaveProviderKey = async () => {
    if (!providerKeyInput) return;
    setIsSavingKey(true);
    try {
      const response = await fetch('/api/provider-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: providerKeyInput,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || pg.saveKeyError || 'Unable to save key');
      }
      setProviderStatuses((prev) => ({
        ...prev,
        [selectedProvider]: payload,
      }));
      updateSetting('useStoredKey', true);
      setProviderKeyInput('');
      setIsManagingKey(false);
      toast({
        title: pg.credentialSavedTitle || 'Credential saved',
        description:
          formatMessage(pg.credentialSavedDescription, {
            provider: selectedProviderConfig.label,
          }) || `${selectedProviderConfig.label} key stored for this workspace.`,
      });
    } catch (error) {
      toast({
        title: pg.saveKeyErrorTitle || 'Unable to save key',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleRemoveProviderKey = async () => {
    setIsSavingKey(true);
    try {
      const response = await fetch(`/api/provider-keys?provider=${selectedProvider}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || pg.deleteKeyError || 'Unable to delete key');
      }
      setProviderStatuses((prev) => {
        const next = { ...prev };
        delete next[selectedProvider];
        return next;
      });
      updateSetting('useStoredKey', false);
      setProviderKeyInput('');
      setIsManagingKey(false);
      toast({
        title: pg.credentialRemovedTitle || 'Credential removed',
        description:
          formatMessage(pg.credentialRemovedDescription, {
            provider: selectedProviderConfig.label,
          }) || `${selectedProviderConfig.label} key deleted.`,
      });
    } catch (error) {
      toast({
        title: pg.deleteKeyErrorTitle || 'Unable to delete key',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg shadow-slate-200/50">
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-amber-500" />
            {pg.apiSettings || 'API Settings'}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-5">
          {/* Provider */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{pg.modelProvider || 'Model Provider'}</Label>
            <Select value={selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder={pg.selectProvider || 'Select provider'} />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedProviderConfig?.description}
            </p>
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{pg.apiEndpoint || 'API Endpoint'}</Label>
            <Select value={endpointSelectValue} onValueChange={handleEndpointChange}>
              <SelectTrigger>
                <SelectValue placeholder={pg.selectEndpoint || 'Select endpoint'} />
              </SelectTrigger>
              <SelectContent>
                {endpointOptions.map((endpoint) => (
                  <SelectItem key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {endpointSelectValue === 'custom' && (
              <Input
                value={settings.baseURL}
                onChange={(e) => updateSetting('baseURL', e.target.value)}
                placeholder={pg.customEndpointPlaceholder || 'https://api.example.com/v1'}
                className="mt-2"
              />
            )}
          </div>

          {/* Provider credential management */}
          {selectedProvider !== 'custom' && (
            <div className="space-y-3 rounded-lg border bg-white/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{pg.storedCredential || 'Stored Credential'}</p>
                  <p className="text-xs text-muted-foreground">
                    {providerStatus?.connected
                      ? `${pg.storedCredentialConnected || 'Connected'}${
                          providerStatus.lastFour
                            ? ` · ${
                                formatMessage(pg.storedCredentialEndsWith, {
                                  lastFour: providerStatus.lastFour,
                                }) || `ends with ${providerStatus.lastFour}`
                              }`
                            : ''
                        }`
                      : pg.storedCredentialMissing || 'No credential saved for this provider.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManagingKey((prev) => !prev)}
                  disabled={isLoadingProviders}
                >
                  {providerStatus?.connected ? pg.updateKey || 'Update Key' : pg.addKey || 'Add Key'}
                </Button>
              </div>

              {isManagingKey && (
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder={
                      formatMessage(pg.enterApiKey, { provider: selectedProviderConfig.label }) ||
                      `Enter ${selectedProviderConfig.label} API key`
                    }
                    value={providerKeyInput}
                    onChange={(e) => setProviderKeyInput(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveProviderKey}
                      disabled={isSavingKey || !providerKeyInput}
                    >
                      {isSavingKey ? pg.savingKey || 'Saving...' : pg.saveKey || 'Save Key'}
                    </Button>
                    {providerStatus?.connected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveProviderKey}
                        disabled={isSavingKey}
                      >
                        {pg.removeKey || 'Remove Key'}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pg.keyStorageNote ||
                      'Keys are stored securely in your workspace and never shared publicly.'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{pg.useStoredKey || 'Use stored key'}</p>
                  <p className="text-xs text-muted-foreground">
                    {canUseStoredCredential
                      ? pg.useStoredKeyEnabled || 'Requests will use the saved credential.'
                      : pg.useStoredKeyDisabled || 'Save a key to enable this option.'}
                  </p>
                </div>
                <Switch
                  checked={settings.useStoredKey && canUseStoredCredential}
                  disabled={!canUseStoredCredential}
                  onCheckedChange={(checked) => updateSetting('useStoredKey', checked)}
                />
              </div>
            </div>
          )}

          {/* Inline API key */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{pg.inlineApiKey || 'API Key (inline)'}</Label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => updateSetting('apiKey', e.target.value)}
                placeholder={pg.apiKeyPlaceholder || 'sk-...'}
                className="pr-10"
                disabled={settings.useStoredKey && selectedProvider !== 'custom'}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.useStoredKey && selectedProvider !== 'custom'
                ? pg.inlineApiKeyHintActive ||
                  'Inline value is disabled while a stored credential is active.'
                : pg.inlineApiKeyHint || 'Keys entered here are only kept locally and cleared on refresh.'}
            </p>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{pg.model || 'Model'}</Label>
            <Select
              value={isCustomModel ? 'custom' : settings.model}
              onValueChange={handleModelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={pg.selectModel || 'Select model'} />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(isCustomModel || customModel !== '') && (
              <Input
                value={settings.model}
                onChange={(e) => updateSetting('model', e.target.value)}
                placeholder={pg.customModelPlaceholder || 'model-name'}
                className="mt-2"
              />
            )}
          </div>

          {/* Parameters */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              {pg.modelParameters || 'Model Parameters'}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      {pg.modelParametersHint ||
                        'Adjust these parameters to control the creativity and length of AI responses.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{pg.temperature || 'Temperature'}</Label>
                <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {settings.temperature.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => updateSetting('temperature', value)}
                min={0}
                max={2}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {pg.temperatureHint || 'Higher values make output more creative but less predictable'}
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{pg.maxTokens || 'Max Tokens'}</Label>
                <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {settings.maxTokens}
                </span>
              </div>
              <Slider
                value={[settings.maxTokens]}
                onValueChange={([value]) => updateSetting('maxTokens', value)}
                min={100}
                max={8000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {pg.maxTokensHint || 'Maximum length of the generated response'}
              </p>
            </div>

            {/* Top P */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{pg.topP || 'Top P'}</Label>
                <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {settings.topP.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[settings.topP]}
                onValueChange={([value]) => updateSetting('topP', value)}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {pg.topPHint || 'Controls diversity of word choices'}
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
