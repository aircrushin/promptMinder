'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, use } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Copy, Send, Settings2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ChatTest from '@/components/chat/ChatTest';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/hooks/use-toast";
import VariableInputs from '@/components/prompt/VariableInputs';
import { replaceVariables } from '@/lib/promptVariables';
import { apiClient } from '@/lib/api-client';

const STORAGE_KEY = 'chat_settings';

const TypewriterText = ({ text }) => {
  return (
    <span className="typing-effect">
      {text}
    </span>
  );
};

const PromptSkeleton = () => {
  const { t } = useLanguage();
  if (!t) return null;
  const tp = t.promptDetailPage;
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex items-center space-x-2 mb-4">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:bg-secondary"
          disabled
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tp?.backToList || 'Back to Prompt List'}
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-6rem)]">
        <div className="h-full flex flex-col">
          <Card className="border-none shadow-lg bg-gradient-to-br from-background to-secondary/10 flex-1">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <div className="mt-6">
                <Skeleton className="h-[300px] w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-full">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-[50px] flex-1" />
                  <Skeleton className="h-[50px] w-[50px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function PromptDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
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
  const [temperature, setTemperature] = useState(0.5);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [customModel, setCustomModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings).model : 'glm-4-flash';
    }
    return 'glm-4-flash';
  });
  const [baseUrl, setBaseUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings).baseUrl : 'https://open.bigmodel.cn/api/paas/v4';
    }
    return 'https://open.bigmodel.cn/api/paas/v4';
  });
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [variableValues, setVariableValues] = useState({});
  const [hasVariables, setHasVariables] = useState(false);
  const [renderedContent, setRenderedContent] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 实时更新渲染的提示词内容
  useEffect(() => {
    if (prompt?.content) {
      const rendered = replaceVariables(prompt.content, variableValues);
      setRenderedContent(rendered);
    }
  }, [prompt?.content, variableValues]);

  useEffect(() => {
    if (id) {
      fetch(`/api/prompts/${id}`)
        .then((response) => response.json())
        .then((data) => {
          setPrompt({...data, tags: data.tags ? data.tags.split(',') : []});
          setSelectedVersion(data.version);
          
          fetch(`/api/prompts?title=${encodeURIComponent(data.title)}`)
            .then((response) => response.json())
            .then((versionsData) => {
              const sameTitle = versionsData.filter(v => v.title === data.title);
              setVersions(sameTitle.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            })
            .catch((error) => console.error('Error fetching versions:', error));
        })
        .catch((error) => console.error('Error fetching prompt:', error));
    }
  }, [id]);

  if (!t) return <PromptSkeleton />;
  const tp = t.promptDetailPage;

  const handleCopy = async () => {
    try {
      // 如果有变量，复制渲染后的内容；否则复制原始内容
      const contentToCopy = hasVariables ? renderedContent : prompt.content;
      await navigator.clipboard.writeText(contentToCopy);
      setCopySuccess(true);
      toast({
        title: tp.copySuccessTitle,
        description: hasVariables ? "已复制渲染后的提示词内容" : tp.copySuccessDescription,
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: tp.copyErrorTitle,
        description: tp.copyErrorDescription,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/prompts');
      } else {
        throw new Error(tp.deleteError);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({ 
        title: "Error",
        description: tp.deleteError,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/prompts/share/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Share failed');
      }

      const shareUrl = `${window.location.origin}/share/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      toast({
        title: tp.shareSuccessTitle,
        description: tp.shareSuccessDescription,
      });
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to share prompt:', err);
      toast({
        title: tp.shareErrorTitle,
        description: tp.shareErrorDescription,
        variant: "destructive",
      });
    }
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    const previousContent = prompt.content;
    setPrompt(prev => ({...prev, content: editedContent}));
    setIsEditing(false);

    try {
      await apiClient.updatePrompt(id, { content: editedContent });
      
      toast({
        title: "Success",
        description: "Content saved successfully.",
      });
      router.push(`/prompts/${id}`);
    } catch (error) {
      console.error('Error saving content:', error);
      setPrompt(prev => ({...prev, content: previousContent}));
      setIsEditing(true);
      toast({ 
        title: "Error",
        description: tp.saveError,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyMessage = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(index);
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
      baseUrl: baseUrl
    });
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setCustomModel(newModel);
    saveSettings({
      apiKey: apiKey,
      model: newModel,
      baseUrl: baseUrl
    });
  };

  const handleBaseUrlChange = (e) => {
    const newBaseUrl = e.target.value;
    setBaseUrl(newBaseUrl);
    saveSettings({
      apiKey: apiKey,
      model: customModel,
      baseUrl: newBaseUrl
    });
  };

  const handleVariablesChange = (values, hasVars) => {
    setVariableValues(values);
    setHasVariables(hasVars);
  };

  const handleVersionChange = (version) => {
    const selectedPrompt = versions.find(v => v.version === version);
    if (selectedPrompt) {
      router.push(`/prompts/${selectedPrompt.id}`);
    }
  };

  if (!prompt) {
    return <PromptSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:bg-secondary"
          onClick={() => router.push('/prompts')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tp.backToList}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[calc(100vh-12rem)] flex flex-col">
          <Card className="border-none shadow-lg bg-gradient-to-br from-background to-secondary/10 flex-1 overflow-hidden flex flex-col">
            <CardContent className="p-4 sm:p-6 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {prompt.title}
                  </h1>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {prompt.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {versions.length > 1 ? (
                          <Select
                            value={selectedVersion}
                            onValueChange={handleVersionChange}
                          >
                            <SelectTrigger className="h-5 text-xs border-none bg-transparent hover:bg-secondary/50 transition-colors">
                              <SelectValue placeholder={tp.selectVersionPlaceholder}>
                                v{selectedVersion}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {versions.map((version) => (
                                <SelectItem 
                                  key={version.id} 
                                  value={version.version}
                                  className="text-xs"
                                >
                                  v{version.version} ({new Date(version.created_at).toLocaleDateString()})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span>v{prompt.version}</span>
                        )}
                      </div>
                    </div>
                    {prompt.tags?.length > 0 && prompt.tags.slice(0, 3).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="bg-primary/5 hover:bg-primary/10 transition-colors duration-200 text-xs px-2 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {prompt.tags?.length > 3 && (
                      <Badge 
                        variant="secondary"
                        className="bg-primary/5 hover:bg-primary/10 transition-colors duration-200 text-xs px-2 py-0"
                      >
                        +{prompt.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={handleShare}
                    variant={shareSuccess ? "success" : "secondary"}
                    className="relative overflow-hidden group w-8 h-8 p-0"
                    title={tp.shareTooltip}
                  >
                    <svg className={`w-3 h-3 transition-transform duration-300 ${shareSuccess ? "rotate-0" : "rotate-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </Button>

                  <Button
                    onClick={() => {
                      router.push(`/prompts/${id}/edit`, {
                        state: {
                          prompt: {
                            ...prompt,
                            tags: Array.isArray(prompt.tags) 
                              ? prompt.tags.join(',') 
                              : (prompt.tags || '')
                          }
                        }
                      });
                    }}
                    variant="default"
                    className="relative overflow-hidden group w-8 h-8 p-0"
                    title={tp.editTooltip}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>

                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    className="relative overflow-hidden group w-8 h-8 p-0"
                    title={tp.deleteTooltip}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* 紧凑的变量输入组件 */}
              <div className="mb-3">
                <VariableInputs
                  content={prompt.content}
                  onVariablesChange={handleVariablesChange}
                  showPreview={false}
                  className=""
                />
              </div>

              {/* 主要的提示词内容区域 - 占据大部分空间 */}
              <Card className="flex-1 border border-primary/10 bg-secondary/5 backdrop-blur-sm overflow-hidden flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between shrink-0 py-3">
                  <CardTitle className="text-base font-semibold flex items-center">
                    <span className="bg-primary/10 p-1.5 rounded-lg mr-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    {tp.contentCardTitle}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className="transition-all duration-200"
                    >
                      {copySuccess ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(prompt.content);
                          }}
                          disabled={isSaving}
                        >
                          {tp.cancel}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSaveContent}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <span className="flex items-center gap-1">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              {tp.saving}
                            </span>
                          ) : tp.save}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsEditing(true);
                          setEditedContent(prompt.content);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="rounded-lg bg-secondary/30 p-4 min-h-full">
                      {isEditing ? (
                        <div className="min-h-[600px] space-y-3">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-full min-h-[500px] text-base leading-relaxed whitespace-pre-wrap text-primary"
                            placeholder={tp.editPlaceholder}
                            style={{ resize: 'vertical', overflowY: 'auto' }}
                          />
                          {/* 编辑时也显示预览 */}
                          <div className="bg-blue-50 p-3 rounded border">
                            <div className="text-xs text-blue-600 font-medium mb-2">实时预览:</div>
                                                        <div className="text-sm text-blue-800">
                               {editedContent.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
                                 if (part.startsWith('{{') && part.endsWith('}}')) {
                                   const variableName = part.slice(2, -2).trim();
                                   const value = variableValues[variableName];
                                   
                                   if (value && value.trim()) {
                                     return (
                                       <span key={index} className="bg-blue-200 text-blue-900 px-2 py-1 rounded-md font-medium">
                                         {value}
                                       </span>
                                     );
                                   } else {
                                     return (
                                       <span key={index} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md border border-orange-300 border-dashed font-medium italic">
                                         {variableName}
                                       </span>
                                     );
                                   }
                                 }
                                 return part;
                               })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-base leading-relaxed whitespace-pre-wrap text-primary min-h-[600px]">
                          {hasVariables ? (
                            <div className="space-y-1">
                              {/* 说明文字 */}

                              {/* 显示渲染后的内容，变量值高亮显示 */}
                              <div className="rendered-content">
                                {prompt.content.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
                                  if (part.startsWith('{{') && part.endsWith('}}')) {
                                    const variableName = part.slice(2, -2).trim();
                                    const value = variableValues[variableName];
                                    
                                    if (value && value.trim()) {
                                      // 已填写的变量 - 蓝色高亮
                                      return (
                                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md border-l-4 border-blue-500 font-medium shadow-sm">
                                          {value}
                                        </span>
                                      );
                                    } else {
                                      // 未填写的变量 - 显示变量名，橙色样式
                                      return (
                                        <span key={index} className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md border border-orange-300 border-dashed font-medium shadow-sm italic">
                                          {variableName}
                                        </span>
                                      );
                                    }
                                  }
                                  return part;
                                })}
                              </div>

                            </div>
                          ) : (
                            prompt.content
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        <div className="h-[calc(100vh-12rem)]">
          <ChatTest 
            prompt={prompt} 
            t={t} 
            variableValues={variableValues}
            hasVariables={hasVariables}
          />
        </div>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tp.deleteConfirmTitle}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{tp.deleteConfirmDescription}</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete();
                setShowDeleteConfirm(false);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 