"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Home, Search, Mail, FileText, Plus, Sparkles } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();

  // Safe fallback for translations
  const notFoundText = t?.notFound || {
    title: "404",
    subtitle: "页面未找到",
    description: "抱歉，您访问的页面不存在或已被移除。",
    backHome: "返回首页",
    explore: "探索提示词",
    contact: "联系支持",
    suggestions: "您可能在找：",
    suggestionItems: [
      "浏览提示词合集",
      "创建新的提示词",
      "管理我的提示词"
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10 flex items-center justify-center px-4 py-16">
      <motion.div
        className="max-w-4xl w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated 404 with decorative elements */}
        <motion.div
          className="relative mb-8"
          animate={floatingAnimation}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-64 h-64 bg-primary/5 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <motion.h1
            className="text-[150px] md:text-[200px] font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-none relative"
            variants={itemVariants}
          >
            {notFoundText.title}
          </motion.h1>

          {/* Decorative sparkles */}
          <motion.div
            className="absolute top-0 left-1/4"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Sparkles className="w-8 h-8 text-primary/40" />
          </motion.div>
          <motion.div
            className="absolute bottom-0 right-1/4"
            animate={{
              rotate: [360, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Sparkles className="w-6 h-6 text-primary/30" />
          </motion.div>
        </motion.div>

        {/* Title and description */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {notFoundText.subtitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {notFoundText.description}
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <Link href="/">
            <motion.button
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-5 h-5" />
              {notFoundText.backHome}
            </motion.button>
          </Link>

          <Link href="/public">
            <motion.button
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5" />
              {notFoundText.explore}
            </motion.button>
          </Link>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          variants={itemVariants}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            {notFoundText.suggestions}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: FileText, text: notFoundText.suggestionItems[0], href: "/public" },
              { icon: Plus, text: notFoundText.suggestionItems[1], href: "/prompts/new" },
              { icon: Search, text: notFoundText.suggestionItems[2], href: "/prompts" }
            ].map((item, index) => (
              <Link key={index} href={item.href}>
                <motion.div
                  className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <item.icon className="w-8 h-8 mb-3 text-primary mx-auto group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-sm font-medium text-card-foreground">
                    {item.text}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Contact support link */}
        <motion.div
          variants={itemVariants}
          className="mt-12"
        >
          <a
            href="mailto:ultrav0229@gmail.com"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Mail className="w-4 h-4" />
            <span className="text-sm">{notFoundText.contact}</span>
          </a>
        </motion.div>

        {/* Decorative bottom gradient */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.div>
    </div>
  );
}
