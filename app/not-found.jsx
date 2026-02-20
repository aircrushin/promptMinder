'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Sparkles, Search } from 'lucide-react';

// 浮动动画配置
const floatAnimation = (delay = 0, duration = 4) => ({
  y: [0, -12, 0],
  transition: {
    duration,
    repeat: Infinity,
    repeatType: 'mirror',
    ease: 'easeInOut',
    delay,
  },
});

// 呼吸动画 - 用于背景元素
const breatheAnimation = {
  scale: [1, 1.05, 1],
  opacity: [0.3, 0.5, 0.3],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// 粒子漂浮动画
const particleFloat = (delay = 0) => ({
  y: [0, -20, 0],
  x: [0, 10, 0],
  opacity: [0.2, 0.6, 0.2],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: 'easeInOut',
    delay,
  },
});

// 容器动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

// 404数字动画
const numberVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

export default function NotFoundPage() {
  const { t, language } = useLanguage();

  // 翻译内容
  const content = {
    zh: {
      title: '页面未找到',
      subtitle: '这个提示词似乎走丢了',
      description: '我们找不到您要查找的页面。它可能已被移动、删除，或者从未存在过。',
      goHome: '返回首页',
      goBack: '返回上一页',
      explorePrompts: '浏览提示词合集',
      errorCode: '错误代码：404',
      suggestions: [
        '检查网址拼写是否正确',
        '返回首页重新导航',
      ],
    },
    en: {
      title: 'Page Not Found',
      subtitle: 'This prompt seems to be lost',
      description: 'We couldn\'t find the page you\'re looking for. It might have been moved, deleted, or never existed.',
      goHome: 'Go Home',
      goBack: 'Go Back',
      explorePrompts: 'Explore Prompts',
      errorCode: 'Error Code: 404',
      suggestions: [
        'Check if the URL is spelled correctly',
        'Return to homepage and navigate',
      ],
    },
  };

  const currentContent = content[language] || content.zh;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* 背景装饰 - 呼吸感的渐变光晕 */}
      <div className="pointer-events-none absolute inset-0">
        {/* 主光晕 - 左上 */}
        <motion.div
          animate={breatheAnimation}
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-500/10"
        />
        {/* 次光晕 - 右下 */}
        <motion.div
          animate={{
            scale: [1.05, 1, 1.05],
            opacity: [0.2, 0.4, 0.2],
            transition: {
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            },
          }}
          className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-indigo-400/20 blur-[100px] dark:bg-indigo-500/10"
        />
        {/* 点缀光晕 - 中间偏右 */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.3, 0.15],
            transition: {
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            },
          }}
          className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-[80px] dark:bg-emerald-500/10"
        />
      </div>

      {/* 点阵网格背景 */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* 漂浮粒子 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={particleFloat(i * 1.2)}
            className="absolute rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              backgroundColor: ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][i],
            }}
          />
        ))}
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* 404 数字展示 */}
          <motion.div variants={numberVariants} className="relative mb-8">
            {/* 装饰性背景 */}
            <motion.div
              animate={floatAnimation(0, 5)}
              className="absolute inset-0 -z-10 flex items-center justify-center"
            >
              <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-2xl" />
            </motion.div>
            
            {/* 404 数字 */}
            <div className="flex items-center justify-center gap-2">
              <span className="bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-8xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-400 sm:text-9xl">
                4
              </span>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  transition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
                className="relative"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-slate-800 sm:h-24 sm:w-24">
                  <Sparkles className="h-10 w-10 text-amber-500 sm:h-12 sm:w-12" />
                </div>
                {/* 小装饰点 */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                    transition: { duration: 2, repeat: Infinity },
                  }}
                  className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-400"
                />
              </motion.div>
              <span className="bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-8xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-400 sm:text-9xl">
                4
              </span>
            </div>
          </motion.div>

          {/* 错误代码标签 */}
          <motion.div
            variants={itemVariants}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400"
          >
            <Search className="h-3.5 w-3.5" />
            {currentContent.errorCode}
          </motion.div>

          {/* 标题 */}
          <motion.h1
            variants={itemVariants}
            className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl"
          >
            {currentContent.title}
          </motion.h1>

          {/* 副标题 */}
          <motion.p
            variants={itemVariants}
            className="mb-4 text-lg font-medium text-slate-500 dark:text-slate-400"
          >
            {currentContent.subtitle}
          </motion.p>

          {/* 描述 */}
          <motion.p
            variants={itemVariants}
            className="mb-8 max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400"
          >
            {currentContent.description}
          </motion.p>

          {/* 建议列表 */}
          <motion.div variants={itemVariants} className="mb-10">
            <ul className="space-y-2 text-left">
              {currentContent.suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {index + 1}
                  </span>
                  {suggestion}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* 按钮组 */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                {currentContent.goHome}
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="border-slate-300 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentContent.goBack}
            </Button>
          </motion.div>

          {/* 探索提示词链接 */}
          <motion.div variants={itemVariants} className="mt-6">
            <Link
              href="/public"
              className="group inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span className="relative">
                {currentContent.explorePrompts}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
              </span>
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </motion.div>
        </motion.div>


      </div>
    </div>
  );
}
