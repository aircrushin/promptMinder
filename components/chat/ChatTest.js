'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Settings2, Send, Check, Copy, HelpCircle, Trash2, User, Bot, Edit3 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from '@/contexts/LanguageContext';
import { replaceVariables } from '@/lib/promptVariables';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

// Message loading animation component
function MessageLoading() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
    >
      <circle cx="4" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_qFRN"
          begin="0;spinner_OcgL.end+0.25s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="12" cy="12" r="2" fill="currentColor">
        <animate
          begin="spinner_qFRN.begin+0.1s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="20" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_OcgL"
          begin="spinner_qFRN.begin+0.2s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
    </svg>
  );
}

const STORAGE_KEY = 'chat_settings';

export default function ChatTest({ prompt, variableValues = {}, hasVariables = false }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings).apiKey : '';
    }
    return '';
  });
  const [selectedModel, setSelectedModel] = useState('glm-4-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [topP, setTopP] = useState(0.7);
  const messagesEndRef = useRef(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [tempEditingContent, setTempEditingContent] = useState("");
  const [customModel, setCustomModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings).model : 'glm-4-flash';
    }
    return 'glm-4-flash';
  });
  const [baseURL, setBaseURL] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings).baseURL : 'https://open.bigmodel.cn/api/paas/v4';
    }
    return 'https://open.bigmodel.cn/api/paas/v4';
  });
const presets = [
  /* ---------- OpenAI ---------- */
  { label: 'OpenAI GPT-4o-mini',      value: 'openai-gpt4omini',   baseURL: 'https://api.openai.com/v1',               model: 'gpt-4o-mini' },
  { label: 'OpenAI GPT-4o',           value: 'openai-gpt4o',       baseURL: 'https://api.openai.com/v1',               model: 'gpt-4o' },
  { label: 'OpenAI GPT-4-turbo',      value: 'openai-gpt4turbo',   baseURL: 'https://api.openai.com/v1',               model: 'gpt-4-turbo' },
  { label: 'OpenAI GPT-3.5-turbo',    value: 'openai-gpt35turbo',  baseURL: 'https://api.openai.com/v1',               model: 'gpt-3.5-turbo' },

  /* ---------- Anthropic ---------- */
  { label: 'Anthropic Claude 3.5 Sonnet', value: 'claude-35-sonnet', baseURL: 'https://api.anthropic.com/v1',         model: 'claude-3-5-sonnet-20240620' },
  { label: 'Anthropic Claude 3 Opus',     value: 'claude-3-opus',    baseURL: 'https://api.anthropic.com/v1',         model: 'claude-3-opus-20240229' },
  { label: 'Anthropic Claude 3 Haiku',    value: 'claude-3-haiku',   baseURL: 'https://api.anthropic.com/v1',         model: 'claude-3-haiku-20240307' },

  /* ---------- Google Gemini ---------- */
  { label: 'Google Gemini 1.5 Flash', value: 'gemini-1-5-flash', baseURL: 'https://generativelanguage.googleapis.com/v1beta', model: 'models/gemini-1.5-flash' },
  { label: 'Google Gemini 1.5 Pro',   value: 'gemini-1-5-pro',   baseURL: 'https://generativelanguage.googleapis.com/v1beta', model: 'models/gemini-1.5-pro' },
  { label: 'Google Gemini 2.5 Flash', value: 'gemini-2-5-flash', baseURL: 'https://generativelanguage.googleapis.com/v1beta', model: 'models/gemini-2.5-flash' },
  { label: 'Google Gemini 2.5 Pro',   value: 'gemini-2-5-pro',   baseURL: 'https://generativelanguage.googleapis.com/v1beta', model: 'models/gemini-2.5-pro' },

  /* ---------- Moonshot ---------- */
  { label: 'Moonshot Kimi 8k',  value: 'moonshot-8k',  baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { label: 'Moonshot Kimi 32k', value: 'moonshot-32k', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k' },
  { label: 'Moonshot Kimi 128k',value: 'moonshot-128k',baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-128k' },

  /* ---------- DeepSeek ---------- */
  { label: 'DeepSeek Chat',   value: 'deepseek-chat',   baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: 'DeepSeek Coder',  value: 'deepseek-coder',  baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-coder' },

  /* ---------- 通义千问(Qwen) ---------- */
  { label: 'Qwen Turbo',   value: 'qwen-turbo',   baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
  { label: 'Qwen Plus',    value: 'qwen-plus',    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { label: 'Qwen Max',     value: 'qwen-max',     baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-max' },

  /* ---------- 智谱 GLM ---------- */
  { label: 'GLM-4',      value: 'glm-4',      baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
  { label: 'GLM-4-Air',  value: 'glm-4-air',  baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-air' },
  { label: 'GLM-4-Flash',value: 'glm-4-flash',baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },

  /* ---------- Baichuan ---------- */
  { label: 'Baichuan 4',     value: 'baichuan-4',     baseURL: 'https://api.baichuan-ai.com/v1', model: 'Baichuan4' },
  { label: 'Baichuan 3-Turbo',value: 'baichuan-3-turbo',baseURL: 'https://api.baichuan-ai.com/v1', model: 'Baichuan3-Turbo' },

  /* ---------- StepFun ---------- */
  { label: 'StepFun 1v', value: 'step-1v', baseURL: 'https://api.stepfun.com/v1', model: 'step-1v-8k' },
  { label: 'StepFun 1',  value: 'step-1',  baseURL: 'https://api.stepfun.com/v1', model: 'step-1-8k' },

  /* ---------- 零一万物 01.AI ---------- */
  { label: 'Yi-Large',       value: 'yi-large',       baseURL: 'https://api.lingyiwanwu.com/v1', model: 'yi-large' },
  { label: 'Yi-Large-Turbo', value: 'yi-large-turbo', baseURL: 'https://api.lingyiwanwu.com/v1', model: 'yi-large-turbo' },

  /* ---------- Custom ---------- */
  { label: 'Custom', value: 'custom', baseURL: '', model: '' },
];
  const [selectedPreset, setSelectedPreset] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!t) return null; // Moved loading state for translations

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || (useCustomKey && !apiKey)) return;
    
    // Check if variables are filled when hasVariables is true
    if (hasVariables && variableValues) {
      const requiredVariables = Object.keys(variableValues).filter(key => 
        !variableValues[key] || variableValues[key].toString().trim() === ''
      );
      
      if (requiredVariables.length > 0) {
        toast({
          variant: "destructive",
          description: t?.promptDetailPage?.chatTest?.variablesRequiredError || "测试前请先填写所有必需的变量字段。",
        });
        return;
      }
    }
    
    setIsLoading(true);
    const newMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    const aiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, aiMessage]);
    
    try {
      const response = await apiClient.chat(
        messages.concat(newMessage).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          apiKey: useCustomKey ? apiKey : undefined,
          model: useCustomKey ? customModel : selectedModel,
          baseURL: useCustomKey ? baseURL : undefined,
          systemPrompt: hasVariables ? replaceVariables(prompt.content, variableValues) : prompt.content,
          temperature: temperature,
          max_tokens: maxTokens,
          top_p: topP
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t?.promptDetailPage?.chatTest?.sendMessageErrorDefault || '请求失败，请检查 API Key 是否正确');
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = accumulatedContent;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = t?.promptDetailPage?.chatTest?.sendMessageErrorPrefix?.replace('{errorMessage}', error.message) || 
                          `错误：${error.message || t?.promptDetailPage?.chatTest?.sendMessageErrorNetwork || '请求失败，请检查 API Key 是否正确以及网络连接是否正常'}`;
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = errorMessage;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(index);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const saveSettings = (settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  };

  const handleApiKeyChange = (e) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    saveSettings({
      apiKey: newApiKey,
      model: customModel,
      baseURL: baseURL
    });
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setCustomModel(newModel);
    saveSettings({
      apiKey: apiKey,
      model: newModel,
      baseURL: baseURL
    });
  };

  const handleBaseURLChange = (e) => {
    const newBaseURL = e.target.value;
    setBaseURL(newBaseURL);
    saveSettings({
      apiKey: apiKey,
      model: customModel,
      baseURL: newBaseURL
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleSaveEdit = async (editedMessageIndex) => {
    if (!tempEditingContent.trim()) return;

    setIsLoading(true);
    setEditingMessage(null);

    // Create the updated messages array
    const updatedMessages = messages.slice(0, editedMessageIndex + 1).map((msg, idx) => {
      if (idx === editedMessageIndex) {
        return {
          ...msg,
          content: tempEditingContent,
          timestamp: new Date().toISOString(), // Update timestamp
        };
      }
      return msg;
    });
    
    setMessages(updatedMessages); 
    setTempEditingContent("");

    // Prepare for AI response
    const aiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      const response = await apiClient.chat(
        updatedMessages.map(msg => ({role: msg.role, content: msg.content})),
        {
          apiKey: useCustomKey ? apiKey : undefined,
          model: useCustomKey ? customModel : selectedModel,
          baseURL: useCustomKey ? baseURL : undefined,
          systemPrompt: prompt.content,
          temperature: temperature,
          max_tokens: maxTokens,
          top_p: topP
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '请求失败，请检查 API Key 是否正确');
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = accumulatedContent;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = t?.promptDetailPage?.chatTest?.sendMessageErrorPrefix?.replace('{errorMessage}', error.message) || 
                          `错误：${error.message || t?.promptDetailPage?.chatTest?.sendMessageErrorNetwork || '请求失败，请检查 API Key 是否正确以及网络连接是否正常'}`;
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = errorMessage;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-md border-border/40">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center">
            <span className="bg-primary/10 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
            <span className="text-foreground">{prompt.title || t.chatTest.defaultPromptTitle}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearChat}
                    className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t.chatTest.clearChatTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    className={`hover:bg-secondary h-8 w-8 ${showSettings ? 'bg-secondary/50' : ''}`}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t.chatTest.settingsTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {showSettings && (
          <div className="mt-4 space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50 animate-in fade-in-50 duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1">
                  {t.chatTest.apiKeyLabel}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-80">
                        <p>{t.chatTest.apiKeyTooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseCustomKey(!useCustomKey)}
                  className="text-xs h-7 px-2 border-border/50"
                >
                  {useCustomKey ? t.chatTest.useDefaultKeyButton : t.chatTest.useCustomKeyButton}
                </Button>
              </div>
              {useCustomKey && (
                <div className="space-y-3 rounded-md bg-background p-3 border border-border/30">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">预制</p>
                    <Select value={selectedPreset} onValueChange={(value) => {
                      setSelectedPreset(value);
                      const preset = presets.find(p => p.value === value);
                      if (preset) {
                        setBaseURL(preset.baseURL);
                        setCustomModel(preset.model);
                      }
                    }}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {presets.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{t.chatTest.apiKeyLabel}</p>
                    <Input
                      type="text"
                      value={apiKey}
                      onChange={handleApiKeyChange}
                      placeholder={t.chatTest.apiKeyPlaceholder}
                      className="font-mono text-xs h-8"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{t.chatTest.modelLabel}</p>
                    <Input
                      type="text"
                      value={customModel}
                      onChange={handleModelChange}
                      placeholder={t.chatTest.modelPlaceholder}
                      className="font-mono text-xs h-8"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{t.chatTest.baseURLabel}</p>
                    <Input
                      type="text"
                      value={baseURL}
                      onChange={handleBaseURLChange}
                      placeholder={t.chatTest.baseURLPlaceholder}
                      className="font-mono text-xs h-8"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <Separator className="my-2 bg-border/50" />
            
            {!useCustomKey && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.chatTest.selectModelLabel}</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glm-4-flash">{t.chatTest.glm4FlashModelFree}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                {t.chatTest.modelParametersLabel}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-80">
                      <p>{t.chatTest.modelParametersTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                            {t.chatTest.temperatureLabel}
                            <HelpCircle className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-60">
                          <p>{t.chatTest.temperatureTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Input
                      type="text"
                      value={temperature}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 1) {
                          setTemperature(value);
                        }
                      }}
                      className="w-16 h-6 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <Slider
                    value={[temperature]}
                    onValueChange={(value) => setTemperature(value[0])}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                            {t.chatTest.maxTokensLabel}
                            <HelpCircle className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-60">
                          <p>{t.chatTest.maxTokensTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Input
                      type="text"
                      value={maxTokens}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 8192) {
                          setMaxTokens(value);
                        }
                      }}
                      className="w-16 h-6 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <Slider
                    value={[maxTokens]}
                    onValueChange={(value) => setMaxTokens(value[0])}
                    min={1}
                    max={8192}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                            {t.chatTest.topPLabel}
                            <HelpCircle className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-60">
                          <p>{t.chatTest.topPTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Input
                      type="text"
                      value={topP}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 1) {
                          setTopP(value);
                        }
                      }}
                      className="w-16 h-6 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <Slider
                    value={[topP]}
                    onValueChange={(value) => setTopP(value[0])}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-6 h-full">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="bg-primary/5 p-3 rounded-full mb-4">
                  <svg className="w-8 h-8 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">{t.chatTest.startConversationTitle}</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  {t.chatTest.startConversationDescription}
                </p>
              </div>
            )}
            
            {messages.map((message, index) => {
              const messageId = `${message.role}-${message.timestamp}-${index}`;
              const isEditing = editingMessage && editingMessage.id === messageId;

              return (
                <div
                  key={messageId}
                  className={`flex flex-col group animate-in slide-in-from-${message.role === 'user' ? 'right' : 'left'}-10 duration-300 ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="max-w-[80%] space-y-1.5">
                    <div className={`flex items-center gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-sm font-medium">
                        {message.role === 'user' ? t.chatTest.userLabel : prompt.title || t.chatTest.aiAssistantLabel}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.role === 'user' && !isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setEditingMessage({ id: messageId, content: message.content });
                            setTempEditingContent(message.content);
                          }}
                          title={t.chatTest.editMessageTooltip}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 w-full">
                        <Textarea
                          value={tempEditingContent}
                          onChange={(e) => setTempEditingContent(e.target.value)}
                          className="min-h-[60px] resize-none border-border/50 focus-visible:ring-primary/30 text-sm"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMessage(null);
                              setTempEditingContent("");
                            }}
                          >
                            {t.chatTest.cancelButton}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(index)}
                            disabled={isLoading || !tempEditingContent.trim()}
                          >
                            {t.chatTest.saveAndResendButton}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.content
                            ? 'bg-muted/50 border border-border/30'
                            : 'bg-muted/30 border border-border/20'
                        }`}
                      >
                        {message.role === 'assistant' && !message.content ? (
                          <div className="flex items-center space-x-2 h-6">
                            <MessageLoading />
                          </div>
                        ) : message.role === 'assistant' ? (
                          <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-pre:my-0 prose-headings:mb-2 prose-headings:mt-4 prose-li:my-0.5">
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <div className="not-prose rounded-md my-3 bg-black/90 relative group">
                                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/10">
                                        <span className="text-xs text-gray-400">{match[1]}</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => handleCopyMessage(String(children).replace(/\n$/, ''), `code-${index}`)}
                                        >
                                          {copiedMessageId === `code-${index}` ? (
                                            <Check className="h-3 w-3" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </div>
                                      <SyntaxHighlighter
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                        customStyle={{
                                          margin: 0,
                                          padding: '1rem',
                                          borderRadius: '0 0 0.375rem 0.375rem',
                                        }}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    </div>
                                  ) : (
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    )}

                    {message.role === 'assistant' && message.content && !isEditing && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => handleCopyMessage(message.content, index)}
                        >
                          {copiedMessageId === index ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="shrink-0 p-4 border-t bg-background/80 backdrop-blur-sm">
          <div className="flex gap-2 items-end">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t.chatTest.inputPlaceholder}
              className="min-h-[60px] resize-none border-border/50 focus-visible:ring-primary/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || (useCustomKey && !apiKey)}
              className="px-4 h-10"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {prompt.title ? `${t.chatTest.currentPromptPrefix} "${prompt.title}" ${t.chatTest.currentPromptSuffix}` : t.chatTest.defaultInputHint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}