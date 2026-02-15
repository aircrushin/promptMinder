'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// 翻译文件（在这里导入以便 Provider 知道有哪些语言）
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';
const translations = { en, zh };

// 1. 创建 Context
const LanguageContext = createContext({
  language: 'zh', // 默认值
  toggleLanguage: () => {}, // 默认函数
  translations, // 包含翻译对象
  t: zh, // 默认翻译对象
});

// 2. 创建 Provider 组件
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('zh'); // 默认中文
  const [_mounted, setMounted] = useState(false);

  useEffect(() => {
    // 确保在客户端环境中运行
    if (typeof window === 'undefined') return;

    setMounted(true);

    // 组件挂载时，尝试从 localStorage 读取语言设置
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
    } else {
      // 如果 localStorage 没有或无效，则设置默认语言的 lang 属性
      document.documentElement.lang = 'zh';
    }
  }, []); // 空依赖数组，只在挂载时运行一次

  const toggleLanguage = useCallback(() => {
    if (typeof window === 'undefined') return;

    setLanguage(prevLanguage => {
      const newLanguage = prevLanguage === 'en' ? 'zh' : 'en';
      // 保存到 localStorage
      localStorage.setItem('language', newLanguage);
      // 更新 HTML lang 属性
      document.documentElement.lang = newLanguage;
      return newLanguage;
    });
  }, []);

  // 将 language、toggleLanguage、translations 和 t 提供给子组件
  const value = {
    language,
    toggleLanguage,
    translations,
    t: translations[language] || zh // 确保始终有有效的翻译对象
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// 3. 创建一个自定义 Hook 以方便使用 (可选但推荐)
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  // t 对象已经从 context 中提供，无需重新计算
  return context;
}; 