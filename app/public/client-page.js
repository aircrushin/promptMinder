'use client';

import { useState, useEffect, useMemo } from 'react';
import { PromptCard } from '@/components/prompt/PromptCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function PublicPromptsClient() {
    const { language, t } = useLanguage();
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(`/api/prompts/public?lang=${language}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch prompts: ${response.status}`);
                }
                
                const data = await response.json();
                setPrompts(data.prompts || []);
            } catch (err) {
                console.error('Error fetching prompts:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPrompts();
    }, [language]); // 当语言改变时重新获取数据

    // 过滤后的提示词列表
    const filteredPrompts = useMemo(() => {
        if (!searchQuery.trim()) {
            return prompts;
        }
        
        return prompts.filter(prompt => 
            prompt.role && 
            prompt.role.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
    }, [prompts, searchQuery]);

    // 清空搜索
    const clearSearch = () => {
        setSearchQuery('');
    };
    
    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        {t && t.publicPage ? t.publicPage.loading || 'Loading...' : 'Loading...'}
                    </p>
                </div>
            </div>
        );
    }
    
    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t && t.publicPage ? t.publicPage.error || 'Error loading prompts' : 'Error loading prompts'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {t && t.publicPage ? t.publicPage.retry || 'Retry' : 'Retry'}
                    </button>
                </div>
            </div>
        );
    }
    
    // Handle case where translations are not loaded yet
    if (!t || !t.publicPage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20 pointer-events-none" />
            
            <div className="relative">
                <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
                    {/* Enhanced header section */}
                    <div className="text-center mb-16 space-y-6">
                        <div className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent leading-tight">
                                {t.publicPage.title}
                            </h1>
                            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
                        </div>
                        
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                            {t.publicPage.subtitle}
                        </p>
                        
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-12" />
                            <span className="px-4 bg-white/80 dark:bg-gray-900/80 rounded-full py-1">
                                {t.publicPage.totalPrompts.replace('{count}', searchQuery ? filteredPrompts.length : prompts.length)}
                            </span>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-12" />
                        </div>
                    </div>

                    {/* 搜索框 */}
                    <div className="mb-12 max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5 z-10 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder={t.publicPage.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-12 h-12 text-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 shadow-lg transition-all duration-300"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                                    title={t.publicPage.clearSearch}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Masonry/Waterfall layout - 小红书风格 */}
                    {filteredPrompts.length > 0 ? (
                        <div className="masonry-container columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
                            {filteredPrompts.map((p, i) => (
                                <div
                                    key={`${language}-${searchQuery}-${i}`} // 添加语言和搜索前缀确保key唯一性
                                    className="masonry-item animate-fade-in-up"
                                    style={{
                                        animationDelay: `${Math.min(i * 50, 1000)}ms`
                                    }}
                                >
                                    <PromptCard prompt={p} />
                                </div>
                            ))}
                        </div>
                    ) : searchQuery ? (
                        // 搜索无结果提示
                        <div className="text-center py-16">
                            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                                {t.publicPage.noResults}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-500 mb-6">
                                {t.publicPage.tryOtherKeywords}{' '}
                                <button 
                                    onClick={clearSearch}
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                    {t.publicPage.clearSearch}
                                </button>
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
            
            {/* Footer */}
            <Footer t={t.footer} />
        </div>
    );
} 