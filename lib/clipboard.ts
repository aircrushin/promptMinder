/**
 * 复制文本到剪贴板的通用函数
 * @param {string} text - 要复制的文本
 * @param {Function} onSuccess - 成功回调
 * @param {Function} onError - 失败回调
 */
export async function copyToClipboard(text, onSuccess, onError) {
  try {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      onSuccess?.();
      return true;
    }
    
    // 降级方案：使用 document.execCommand
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      onSuccess?.();
      return true;
    } else {
      throw new Error('document.execCommand failed');
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    onError?.(error);
    return false;
  }
}

/**
 * React Hook 形式的剪贴板操作
 */
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useClipboard(successMessage = '已复制到剪贴板', errorMessage = '复制失败') {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = useCallback(async (text) => {
    const success = await copyToClipboard(
      text,
      () => {
        setCopied(true);
        toast({
          description: successMessage,
          duration: 2000,
        });
        setTimeout(() => setCopied(false), 2000);
      },
      (error) => {
        toast({
          description: errorMessage,
          variant: 'destructive',
          duration: 2000,
        });
      }
    );
    return success;
  }, [toast, successMessage, errorMessage]);

  return { copy, copied };
} 