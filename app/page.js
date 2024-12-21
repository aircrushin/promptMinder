"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TypeAnimation } from 'react-type-animation';

export default function Home() {
  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* 添加动态网格背景 */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] animate-[grid_20s_linear_infinite]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      
      {/* 添加装饰性光效 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl" />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl font-bold text-white mb-6 drop-shadow-lg tracking-tight">
              ✨ Prompt Manager
            </h1>
            <TypeAnimation
              sequence={[
                '一个优雅简洁的提示词管理器',
                2000,
                '为AI从业者量身打造',
                2000,
                '让提示词管理更轻松',
                2000,
              ]}
              wrapper="p"
              speed={50}
              repeat={Infinity}
              className="text-2xl text-gray-300 mb-8 drop-shadow-md max-w-2xl mx-auto"
            />
            <p className="text-gray-400 mb-16 max-w-xl mx-auto">
              专为AI从业者、内容创作者和提示词工程师打造，
              帮助您更好地管理、优化和共享AI提示词。
            </p>
          </motion.div>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link
              href="/prompts/new"
              className="w-full sm:w-auto group rounded-full bg-white px-8 py-4 text-gray-900 font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                创建提示词
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/prompts"
              className="w-full sm:w-auto rounded-full border border-white/30 backdrop-blur-sm px-8 py-4 text-white font-medium hover:bg-white/10 transform hover:scale-105 transition-all duration-200"
            >
              浏览提示词
            </Link>
            <Link
              href="https://github.com/liujuntao123/prompt-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full border border-white/30 backdrop-blur-sm px-8 py-4 text-white/70 hover:text-white/90 font-medium hover:bg-white/10 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </Link>
          </motion.div>
          
          <motion.div 
            className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <FeatureCard
              icon="🔄"
              title="版本控制"
              description="追踪并维护您的提示词修改历史，随时回溯之前的版本"
            />
            <FeatureCard
              icon="🎯"
              title="智能组织"
              description="通过标签和文件夹系统，轻松组织和检索您的提示词库"
            />
            <FeatureCard
              icon="📱"
              title="移动端支持"
              description="完美适配移动设备，随时随地管理和使用您的提示词"
            />
            <FeatureCard
              icon="🔍"
              title="智能搜索"
              description="强大的搜索功能，快速定位所需的提示词"
            />
            <FeatureCard
              icon="🤝"
              title="协作共享"
              description="轻松与团队成员共享和协作优化提示词"
            />
            <FeatureCard
              icon="🔐"
              title="安全可靠"
              description="本地存储，确保您的提示词数据安全"
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="group bg-white/[0.03] backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]"
    >
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-gray-100">{title}</h3>
      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300">{description}</p>
    </motion.div>
  );
}
