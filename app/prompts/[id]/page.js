'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { Spinner } from '@/app/components/ui/Spinner';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Settings2 } from "lucide-react"

export default function PromptDetail({ params }) {
  const router = useRouter();
  const {id} = use(params);
  const [prompt, setPrompt] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('glm-4-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [temperature, setTemperature] = useState(0.5);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch the prompt data from your API or data source
      fetch(`/api/prompts/${id}`)
        .then((response) => response.json())
        .then((data) => setPrompt({...data, cover_img: data.cover_img ? data.cover_img : null,tags: data.tags ? data.tags.split(',') : []}))
        .catch((error) => console.error('Error fetching prompt:', error));
    }
  }, [id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
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
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const handleShare = async () => {
    try {
      // 首先调用 API 将提示词设为公开
      const response = await fetch(`/api/prompts/share/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('分享失败');
      }

      // 成功后复制分享链接
      const shareUrl = `${window.location.origin}/share/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to share prompt:', err);
      // 可以添加错误提示
      alert('分享失败，请稍后重试');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || (useCustomKey && !apiKey)) return;
    
    setIsLoading(true);
    // 添加用户消息到聊天记录
    const newMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.concat(newMessage).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          apiKey: useCustomKey ? apiKey : undefined,
          model: selectedModel,
          systemPrompt: prompt.content,
          temperature: temperature
        })
      });

      if (!response.ok) {
        throw new Error('AI 服务请求失败');
      }

      const data = await response.json();
      const aiResponse = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error:', error);
      // 添加错误消息到聊天
      const errorMessage = {
        role: 'assistant',
        content: '抱歉，处理您的请求时发生错误。请检查您的 API Key 和网络连接。',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    
    // 保存旧的内容以备回滚
    const previousContent = prompt.content;
    
    // 乐观更新 - 立即更新UI
    setPrompt(prev => ({...prev, content: editedContent}));
    setIsEditing(false);

    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent
        })
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

    } catch (error) {
      console.error('Error saving content:', error);
      // 如果保存失败，回滚到之前的内容
      setPrompt(prev => ({...prev, content: previousContent}));
      setIsEditing(true);
      // 显示错误提示
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (!prompt) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
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
          返回提示词列表
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px]">
        <div className="h-full flex flex-col">
          {prompt.cover_img && (
            <Card className="mb-6 bg-gradient-to-b from-background to-secondary/20 border-none">
              <CardContent className="p-0">
                <div className="rounded-lg overflow-hidden h-[200px] relative">
                  <Image 
                    src={prompt.cover_img} 
                    alt={prompt.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    width={1200}
                    height={800}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-lg bg-gradient-to-br from-background to-secondary/10 flex-1 overflow-hidden flex flex-col">
            <CardContent className="p-6 sm:p-8 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                    {prompt.title}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {prompt.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(prompt.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Version {prompt.version}
                    </div>
                    {prompt.tags?.length > 0 && prompt.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="bg-primary/5 hover:bg-primary/10 transition-colors duration-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleShare}
                    variant={shareSuccess ? "success" : "secondary"}
                    className="relative overflow-hidden group w-10 h-10 p-0"
                    title="分享"
                  >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${shareSuccess ? "rotate-0" : "rotate-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </Button>

                  <Button
                    onClick={handleCopy}
                    variant={copySuccess ? "success" : "secondary"}
                    className="relative overflow-hidden group w-10 h-10 p-0"
                    title="复制"
                  >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${copySuccess ? "rotate-0" : "rotate-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-12a2 2 0 00-2-2h-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </Button>

                  <Button
                    onClick={() => router.push(`/prompts/${id}/edit`)}
                    variant="default"
                    className="relative overflow-hidden group w-10 h-10 p-0"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>

                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    className="relative overflow-hidden group w-10 h-10 p-0"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>

              <Card className="flex-1 border border-primary/10 bg-secondary/5 backdrop-blur-sm overflow-hidden flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between shrink-0">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <span className="bg-primary/10 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    提示词内容
                  </CardTitle>
                  <div className="flex gap-2">
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
                          取消
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
                              保存中
                            </span>
                          ) : '保存'}
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
                  <ScrollArea className="h-[500px] w-full">
                    <div className="rounded-lg bg-secondary/30 p-4 min-h-full">
                      {isEditing ? (
                        <div className="h-[500px]">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-full text-base leading-relaxed whitespace-pre-wrap font-mono text-primary"
                            placeholder="输入提示词内容..."
                            style={{ 
                              height: '100%',
                              maxHeight: '100%',
                              overflowY: 'auto'
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-base leading-relaxed whitespace-pre-wrap font-mono text-primary">
                          {prompt.content}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        <div className="h-full flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <span className="bg-primary/10 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </span>
                  测试
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="hover:bg-secondary"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
              
              {showSettings && (
                <div className="mt-4 space-y-4 p-4 bg-secondary/10 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">API Key</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUseCustomKey(!useCustomKey)}
                        className="text-xs"
                      >
                        {useCustomKey ? "使用默认 Key" : "使用自定义 Key"}
                      </Button>
                    </div>
                    {useCustomKey && (
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="输入您的 API Key"
                        className="font-mono"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">选择模型</label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="glm-4-flash">GLM-4-Flash (免费)</SelectItem>
                        <SelectItem value="glm-4">GLM-4</SelectItem>
                        <SelectItem value="glm-3-turbo">GLM-3-Turbo</SelectItem>
                        <SelectItem value="chatglm_turbo">ChatGLM Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">回答随机性 (Temperature)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm w-12">{temperature}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      较低的值会产生更确定的回答，较高的值会产生更有创意的回答
                    </p>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 w-full">
                <div className="space-y-4 p-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-4 flex gap-2 p-4">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="输入���息..."
                  className="min-h-[60px]"
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
                  className="px-3"
                >
                  {isLoading ? (
                    <span className="animate-spin">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </span>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">确定要删除这个提示词吗？此操作无法撤销。</p>
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