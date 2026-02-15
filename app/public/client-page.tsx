'use client';

import { useState, useEffect, useMemo } from 'react';
import { PromptCard } from '@/components/prompt/PromptCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, X, ChevronUp, Plus, ChevronLeft, ChevronRight, Clock, Heart } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';
import { generatePromptListSchema, generateBreadcrumbSchema, generateSchemaGraph } from '@/lib/geo-utils';

export default function PublicPromptsClient() {
    const { language, t: _t } = useLanguage();
    const t = _t as Record<string, any>;
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
        content: '',
        language: 'zh'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 分类筛选状态
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // 排序状态
    const [sortBy, setSortBy] = useState('created_at');
    
    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
        hasNextPage: false,
        hasPreviousPage: false
    });
    
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
                
                const params = new URLSearchParams({
                    lang: language,
                    page: currentPage.toString(),
                    pageSize: pageSize.toString(),
                    sortBy: sortBy,
                    sortOrder: 'desc'
                });
                if (selectedCategory) {
                    params.set('category', selectedCategory);
                }
                
                const data = await apiClient.request(`/api/prompts/public?${params.toString()}`);
                setPrompts(data.prompts || []);
                setCategories(data.categories || []);
                setPagination(data.pagination || {
                    total: 0,
                    totalPages: 0,
                    currentPage: 1,
                    pageSize: 20,
                    hasNextPage: false,
                    hasPreviousPage: false
                });
                
                // 滚动到顶部
                scrollToTop();
            } catch (err) {
                console.error('Error fetching prompts:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPrompts();
    }, [language, currentPage, pageSize, selectedCategory, sortBy]); // 当语言、页码、分类或排序改变时重新获取数据
    
    // 切换分类时重置页码
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    // 切换排序时重置页码
    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
        setCurrentPage(1);
    };

    // 分页导航函数
    const goToPage = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setCurrentPage(page);
        }
    };

    const nextPage = () => {
        if (pagination.hasNextPage) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const previousPage = () => {
        if (pagination.hasPreviousPage) {
            setCurrentPage(prev => prev - 1);
        }
    };

    // 过滤后的提示词列表 (现在只用于客户端搜索显示)
    const filteredPrompts = useMemo(() => {
        if (!searchQuery.trim()) {
            return prompts;
        }
        
        return prompts.filter(prompt => 
            prompt.role && 
            prompt.role.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
    }, [prompts, searchQuery]);

    // 生成GEO优化的结构化数据
    // 注意：Hooks 必须在所有条件 return 之前调用，避免 Hook 顺序变化导致崩溃
    const structuredData = useMemo(() => {
        const promptList = Array.isArray(prompts) ? prompts : [];
        if (!promptList.length) return null;
        
        return generateSchemaGraph([
            // ItemList结构化数据 - 列出所有提示词
            generatePromptListSchema(promptList, {
                name: language === 'zh' ? 'AI提示词合集' : 'AI Prompt Collection',
                description: language === 'zh' 
                    ? '精选的AI提示词集合，支持ChatGPT、Claude等模型'
                    : 'Curated collection of AI prompts for ChatGPT, Claude, and more',
                url: '/public',
            }),
            // 面包屑导航
            generateBreadcrumbSchema([
                { name: language === 'zh' ? '首页' : 'Home', url: '/' },
                { name: language === 'zh' ? '提示词合集' : 'Prompt Collection', url: '/public' },
            ]),
            // CollectionPage结构化数据
            {
                "@type": "CollectionPage",
                "@id": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com'}/public#collection`,
                name: language === 'zh' ? 'AI提示词合集' : 'AI Prompt Collection',
                description: language === 'zh' 
                    ? '浏览社区贡献的优质AI提示词'
                    : 'Browse quality AI prompts contributed by the community',
                numberOfItems: pagination.total,
                hasPart: promptList.slice(0, 10).map(p => ({
                    "@type": "CreativeWork",
                    name: p.title || p.role,
                    description: p.content?.substring(0, 100),
                })),
            },
        ]);
    }, [prompts, pagination.total, language]);

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
                    content: contributeForm.content.trim(),
                    language: contributeForm.language
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
                content: '',
                language: 'zh'
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
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground/70"></div>
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
                        className="mt-4 px-4 py-2 rounded bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
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
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground/70"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950">
            {/* GEO优化：提示词合集结构化数据 */}
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            )}
            {/* Background decoration */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-black/5 via-transparent to-black/5 dark:from-white/5 dark:to-white/5 pointer-events-none -z-10" />
            <div className="relative align-center justify-center">
                <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
                    {/* Enhanced header section */}
                    <div className="text-center mb-16 space-y-6">
                        <div className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent leading-tight">
                                {t.publicPage.title}
                            </h1>
                            <div className="h-1 w-24 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 mx-auto rounded-full" />
                        </div>
                        
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                            {t.publicPage.subtitle}
                        </p>
                        
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-12" />
                            <span className="px-4 bg-white/80 dark:bg-gray-900/80 rounded-full py-1">
                                {t.publicPage.totalPrompts.replace('{count}', String(pagination.total))}
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
                                    className="pl-12 pr-12 h-12 text-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-border dark:border-gray-700 focus:border-foreground/30 dark:focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 dark:focus:ring-foreground/20 shadow-lg transition-all duration-300"
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
                                        className="h-12 px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-primary-foreground shadow-lg hover:shadow-xl whitespace-nowrap"
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
                                        
                                        {/* 语言选择 */}
                                        <div className="space-y-2">
                                            <Label>{language === 'zh' ? '语言' : 'Language'}</Label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="contribute-language"
                                                        value="zh"
                                                        checked={contributeForm.language === 'zh'}
                                                        onChange={(e) => handleContributeInputChange('language', e.target.value)}
                                                        disabled={isSubmitting}
                                                        className="w-4 h-4 text-slate-900"
                                                    />
                                                    <span className="text-sm">中文</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="contribute-language"
                                                        value="en"
                                                        checked={contributeForm.language === 'en'}
                                                        onChange={(e) => handleContributeInputChange('language', e.target.value)}
                                                        disabled={isSubmitting}
                                                        className="w-4 h-4 text-slate-900"
                                                    />
                                                    <span className="text-sm">English</span>
                                                </label>
                                            </div>
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
                                                className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-primary-foreground"
                                            >
                                                {isSubmitting ? t.publicPage.contributeSubmitting : t.publicPage.contributeSubmit}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        
                        {/* 排序选择器 */}
                        <div className="flex justify-center gap-2 mt-6">
                            <button
                                onClick={() => handleSortChange('created_at')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                    sortBy === 'created_at'
                                        ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 text-white shadow-lg'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Clock className="w-4 h-4" />
                                {language === 'zh' ? '最新' : 'Latest'}
                            </button>
                            <button
                                onClick={() => handleSortChange('likes')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                    sortBy === 'likes'
                                        ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 text-white shadow-lg'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Heart className="w-4 h-4" />
                                {language === 'zh' ? '最热' : 'Popular'}
                            </button>
                        </div>

                        {/* 分类筛选器 */}
                        {categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                <button
                                    onClick={() => handleCategoryChange('')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                        selectedCategory === ''
                                            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 text-white shadow-lg'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {language === 'zh' ? '全部' : 'All'}
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryChange(category)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                            selectedCategory === category
                                                ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 text-white shadow-lg'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        )}
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
                        (<div className="text-center py-16">
                            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                                {t.publicPage.noResults}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-500 mb-6">
                                {t.publicPage.tryOtherKeywords}{' '}
                                <button 
                                    onClick={clearSearch}
                                    className="text-foreground underline hover:text-foreground/70 dark:text-white dark:hover:text-white/80"
                                >
                                    {t.publicPage.clearSearch}
                                </button>
                            </p>
                        </div>)
                    ) : null}

                    {/* 分页控件 - 只在非搜索状态下显示 */}
                    {!searchQuery && pagination.totalPages > 1 && (
                        <div className="mt-12 flex justify-center items-center gap-2">
                            {/* 上一页按钮 */}
                            <button
                                onClick={previousPage}
                                disabled={!pagination.hasPreviousPage}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                                    ${pagination.hasPreviousPage
                                        ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-slate-900 hover:to-slate-700 hover:text-white shadow-md hover:shadow-lg border border-border dark:border-gray-700'
                                        : 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-800'
                                    }
                                `}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">{t.publicPage.pagination.previous}</span>
                            </button>

                            {/* 页码按钮 */}
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const pages = [];
                                    const totalPages = pagination.totalPages;
                                    const current = pagination.currentPage;
                                    
                                    // 始终显示第一页
                                    pages.push(1);
                                    
                                    // 计算显示范围
                                    let startPage = Math.max(2, current - 1);
                                    let endPage = Math.min(totalPages - 1, current + 1);
                                    
                                    // 如果当前页靠近开始，多显示后面的页
                                    if (current <= 3) {
                                        endPage = Math.min(totalPages - 1, 4);
                                    }
                                    
                                    // 如果当前页靠近结束，多显示前面的页
                                    if (current >= totalPages - 2) {
                                        startPage = Math.max(2, totalPages - 3);
                                    }
                                    
                                    // 添加省略号（如果需要）
                                    if (startPage > 2) {
                                        pages.push('ellipsis-start');
                                    }
                                    
                                    // 添加中间页码
                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(i);
                                    }
                                    
                                    // 添加省略号（如果需要）
                                    if (endPage < totalPages - 1) {
                                        pages.push('ellipsis-end');
                                    }
                                    
                                    // 始终显示最后一页（如果总页数大于1）
                                    if (totalPages > 1) {
                                        pages.push(totalPages);
                                    }
                                    
                                    return pages.map((page) => {
                                        if (typeof page === 'string') {
                                            // 省略号
                                            return (
                                                <span
                                                    key={page}
                                                    className="px-2 text-gray-400 dark:text-gray-600"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }
                                        
                                        const isActive = page === current;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`
                                                    min-w-[2.5rem] h-10 px-3 rounded-lg font-medium transition-all duration-300
                                                    ${isActive
                                                        ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 text-white shadow-lg scale-110'
                                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-slate-900 hover:to-slate-700 hover:text-white shadow-md hover:shadow-lg border border-border dark:border-gray-700'
                                                    }
                                                `}
                                            >
                                                {page}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            {/* 下一页按钮 */}
                            <button
                                onClick={nextPage}
                                disabled={!pagination.hasNextPage}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                                    ${pagination.hasNextPage
                                        ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-slate-900 hover:to-slate-700 hover:text-white shadow-md hover:shadow-lg border border-border dark:border-gray-700'
                                        : 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-800'
                                    }
                                `}
                            >
                                <span className="hidden sm:inline">{t.publicPage.pagination.next}</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Footer */}
            <Footer t={t.footer} />
            {/* 回到顶部按钮 */}
            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white rounded-full shadow-xl hover:shadow-2xl backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-4 focus:ring-black/20 dark:focus:ring-white/20"
                    title="回到顶部/backtotop"
                    aria-label="Back to top"
                >
                    <ChevronUp className="w-6 h-6 mx-auto" />
                </button>
            )}
        </div>
    );
} 
