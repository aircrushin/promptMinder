'use client';

import { useState } from 'react';
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
import { Settings2, Eye, EyeOff, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  { value: 'glm-4v-flash', label: 'GLM-4V Flash (Free)' },
  { value: 'custom', label: 'Custom Model...' },
];

const PRESET_ENDPOINTS = [
  { value: 'openai-default', label: 'Default (OpenAI)', url: '' },
  { value: 'openai', label: 'OpenAI', url: 'https://api.openai.com/v1' },
  { value: 'anthropic', label: 'Anthropic', url: 'https://api.anthropic.com/v1' },
  { value: 'zhipu', label: 'Zhipu AI', url: 'https://open.bigmodel.cn/api/paas/v4' },
  { value: 'custom', label: 'Custom Endpoint...' },
];

export function PlaygroundSettings({ settings, onSettingsChange }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [customModel, setCustomModel] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');

  const updateSetting = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

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
    const preset = PRESET_ENDPOINTS.find((endpoint) => endpoint.value === value);
    updateSetting('baseURL', preset?.url || '');
  };

  const isCustomModel =
    !settings.model ||
    !PRESET_MODELS.some((m) => m.value === settings.model && m.value !== 'custom');

  const isCustomEndpoint = (() => {
    if (customEndpoint !== '') return true;
    const preset = PRESET_ENDPOINTS.find(
      (endpoint) => endpoint.url === settings.baseURL && endpoint.value !== 'custom'
    );
    return !preset;
  })();

  const endpointSelectValue = (() => {
    if (customEndpoint !== '') return 'custom';
    const preset = PRESET_ENDPOINTS.find(
      (endpoint) => endpoint.url === settings.baseURL && endpoint.value !== 'custom'
    );
    if (preset) return preset.value;
    return 'custom';
  })();

  return (
    <Card className="border-0 shadow-lg shadow-slate-200/50">
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-amber-500" />
            API Settings
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
          {/* Base URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">API Endpoint</Label>
            <Select value={endpointSelectValue} onValueChange={handleEndpointChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select endpoint" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_ENDPOINTS.map((endpoint) => (
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
                placeholder="https://api.example.com/v1"
                className="mt-2"
              />
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">API Key</Label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => updateSetting('apiKey', e.target.value)}
                placeholder="sk-..."
                className="pr-10"
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
              Your API key is not stored on our servers
            </p>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Model</Label>
            <Select
              value={isCustomModel ? 'custom' : settings.model}
              onValueChange={handleModelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_MODELS.map((model) => (
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
                placeholder="model-name"
                className="mt-2"
              />
            )}
          </div>

          {/* Parameters */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              Model Parameters
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Adjust these parameters to control the creativity and length of AI responses.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Temperature</Label>
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
                Higher values make output more creative but less predictable
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Max Tokens</Label>
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
                Maximum length of the generated response
              </p>
            </div>

            {/* Top P */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Top P</Label>
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
                Controls diversity of word choices
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}


