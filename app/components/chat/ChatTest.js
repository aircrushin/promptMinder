'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Settings2, Send, Check, Copy } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const STORAGE_KEY = 'chat_settings';

export default function ChatTest({ prompt }) {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || (useCustomKey && !apiKey)) return;
    
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
          model: useCustomKey ? customModel : selectedModel,
          baseUrl: useCustomKey ? baseUrl : undefined,
          systemPrompt: prompt.content,
          temperature: temperature
        })
      });

      if (!response.ok) {
        throw new Error('AI 服务请求失败');
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
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = '抱歉，处理您的请求时发生错误。请检查您的 API Key 和网络连接。';
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

  return (
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
            {/* Settings content... */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">API Key (兼容OpenAI)</label>
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
                <>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="输入您的 API Key"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Model</p>
                  <Input
                    type="text"
                    value={customModel}
                    onChange={handleModelChange}
                    placeholder="输入模型名称 (例如: gpt-3.5-turbo)"
                    className="font-mono mt-2"
                  />
                  <p className="text-xs text-muted-foreground">BaseURL</p>
                  <Input
                    type="text"
                    value={baseUrl}
                    onChange={handleBaseUrlChange}
                    placeholder="BaseURL 默认: https://open.bigmodel.cn/api/paas/v4"
                    className="font-mono mt-2"
                  />
                </>
              )}
            </div>
            
            {!useCustomKey && (
              <div className="space-y-2">
                <label className="text-sm font-medium">选择模型</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glm-4-flash">GLM-4-Flash (免费)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1">
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
                      : 'bg-white text-black'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-gray-500">
                      {message.role === 'user' ?  '' : prompt.title}
                    </div>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-gray-700"
                        onClick={() => handleCopyMessage(message.content, index)}
                      >
                        {copiedMessageId === index ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  {message.role === 'assistant' ? (
                    <div className="text-sm prose prose-invert prose-p:my-0 prose-pre:my-0 prose-pre:bg-secondary/50 max-w-none prose-headings:text-black prose-p:text-black prose-strong:text-black prose-ul:text-black prose-ol:text-black">
                      <ReactMarkdown
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="shrink-0 mt-4 flex gap-2 p-4 border-t">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="输入消息..."
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
  );
} 