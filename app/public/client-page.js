'use client';

import { useState, useEffect, useMemo } from 'react';
import { PromptCard } from '@/components/prompt/PromptCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, X, ChevronUp, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';

export default function PublicPromptsClient() {
    const { language, t } = useLanguage();
    const { toast } = useToast();
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isContributeOpen, setIsContributeOpen] = useState(false);
    const [contributeForm, setContributeForm] = useState({
        title: '',
        role: '',
        content: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 滚动监听器
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            setShowBackToTop(scrollTop > 300); // 滚动超过300px时显示按钮
        };

        window.addEventListener('scroll', handleScroll);
        
        // 确保页面默认在顶部
        window.scrollTo(0, 0);
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 回到顶部函数
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const data = await apiClient.request(`/api/prompts/public?lang=${language}`);
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

    // 处理贡献表单提交
    const handleContributeSubmit = async (e) => {
        e.preventDefault();
        
        // 表单验证
        if (!contributeForm.title.trim()) {
            toast({
                title: t.publicPage.toast.validationFailed,
                description: t.publicPage.contributeTitleRequired,
                variant: "destructive",
            });
            return;
        }
        if (!contributeForm.role.trim()) {
            toast({
                title: t.publicPage.toast.validationFailed,
                description: t.publicPage.contributeRoleRequired,
                variant: "destructive",
            });
            return;
        }
        if (!contributeForm.content.trim()) {
            toast({
                title: t.publicPage.toast.validationFailed,
                description: t.publicPage.contributeContentRequired,
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        
        try {
            await apiClient.request('/api/contributions', {
                method: 'POST',
                body: {
                    title: contributeForm.title.trim(),
                    role: contributeForm.role.trim(),
                    content: contributeForm.content.trim()
                },
            });
            
            // 成功提示
            toast({
                title: t.publicPage.toast.submitSuccess,
                description: t.publicPage.contributeSuccess,
                variant: "default",
            });
            
            // 重置表单
            setContributeForm({
                title: '',
                role: '',
                content: ''
            });
            
            // 关闭弹窗
            setIsContributeOpen(false);
        } catch (error) {
            console.error('Error submitting contribution:', error);
            toast({
                title: t.publicPage.toast.submitFailed,
                description: error.message || t.publicPage.contributeError,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 处理贡献表单输入变化
    const handleContributeInputChange = (field, value) => {
        setContributeForm(prev => ({
            ...prev,
            [field]: value
        }));
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
            
            <div className="relative align-center justify-center">
                <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
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

                    {/* 搜索框和贡献按钮 */}
                    <div className="mb-12 max-w-4xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            {/* 搜索框 */}
                            <div className="relative flex-1 max-w-2xl">
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
                            
                            {/* 贡献按钮 */}
                            <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
                                <DialogTrigger asChild>
                                    <Button 
                                        className="h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl whitespace-nowrap"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        {t.publicPage.contributeButton}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{t.publicPage.contributeModalTitle}</DialogTitle>
                                        <DialogDescription>
                                            {t.publicPage.contributeModalDescription}
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <form onSubmit={handleContributeSubmit} className="space-y-4">
                                        {/* 标题 */}
                                        <div className="space-y-2">
                                            <Label htmlFor="contribute-title">{t.publicPage.contributeTitleLabel}</Label>
                                            <Input
                                                id="contribute-title"
                                                value={contributeForm.title}
                                                onChange={(e) => handleContributeInputChange('title', e.target.value)}
                                                placeholder={t.publicPage.contributeTitlePlaceholder}
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        
                                        {/* 角色/类别 */}
                                        <div className="space-y-2">
                                            <Label htmlFor="contribute-role">{t.publicPage.contributeRoleLabel}</Label>
                                            <Input
                                                id="contribute-role"
                                                value={contributeForm.role}
                                                onChange={(e) => handleContributeInputChange('role', e.target.value)}
                                                placeholder={t.publicPage.contributeRolePlaceholder}
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        
                                        {/* 提示词内容 */}
                                        <div className="space-y-2">
                                            <Label htmlFor="contribute-content">{t.publicPage.contributeContentLabel}</Label>
                                            <Textarea
                                                id="contribute-content"
                                                value={contributeForm.content}
                                                onChange={(e) => handleContributeInputChange('content', e.target.value)}
                                                placeholder={t.publicPage.contributeContentPlaceholder}
                                                rows={6}
                                                required
                                                disabled={isSubmitting}
                                                className="resize-none"
                                            />
                                        </div>
                                        
                                        {/* 按钮 */}
                                        <div className="flex justify-end space-x-2 pt-4">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={() => setIsContributeOpen(false)}
                                                disabled={isSubmitting}
                                            >
                                                {t.publicPage.contributeCancel}
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                disabled={isSubmitting}
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                            >
                                                {isSubmitting ? t.publicPage.contributeSubmitting : t.publicPage.contributeSubmit}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Masonry/Waterfall layout */}
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

            {/* 回到顶部按钮 */}
            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 text-white rounded-full shadow-xl hover:shadow-2xl backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-4 focus:ring-blue-400/50 dark:focus:ring-blue-500/50"
                    title="回到顶部/backtotop"
                    aria-label="Back to top"
                >
                    <ChevronUp className="w-6 h-6 mx-auto" />
                </button>
            )}
        </div>
    );
} 