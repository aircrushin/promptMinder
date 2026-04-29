'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { Check, Copy, ImageIcon, Import, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// Direct stable Unsplash photo URLs — one curated photo per category.
// images.unsplash.com/photo-{ID} never redirects and doesn't 503.
const CATEGORY_IMAGES = {
  pop:               'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80&auto=format&fit=crop',
  'rnb-soul':        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80&auto=format&fit=crop',
  rock:              'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80&auto=format&fit=crop',
  electronic:        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80&auto=format&fit=crop',
  jazz:              'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80&auto=format&fit=crop',
  classical:         'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80&auto=format&fit=crop',
  world:             'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80&auto=format&fit=crop',
  'hip-hop':         'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80&auto=format&fit=crop',
  'folk-country':    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80&auto=format&fit=crop',
  'funk-disco-gospel':'https://images.unsplash.com/photo-1545128485-c35305c4cfb2?w=800&q=80&auto=format&fit=crop',
  'reggae-ska':      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80&auto=format&fit=crop',
  'chinese-singers': 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80&auto=format&fit=crop',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80&auto=format&fit=crop';

function getPromptImageSrc(prompt) {
  if (prompt?.image && typeof prompt.image === 'string' && /^https?:\/\//.test(prompt.image)) {
    return prompt.image;
  }
  return CATEGORY_IMAGES[prompt?.category] || FALLBACK_IMAGE;
}

export default function SunoGallery({ prompts }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [importingId, setImportingId] = useState(null);
  const [featuredPrompt, setFeaturedPrompt] = useState(prompts?.[0]);

  const { t } = useLanguage();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { toast } = useToast();

  const pageCopy = t?.sunoPage;

  const filters = [
    { id: 'all', label: pageCopy?.filters?.all || 'All' },
    { id: 'pop', label: pageCopy?.filters?.pop || 'Pop' },
    { id: 'rnb-soul', label: pageCopy?.filters?.rnbSoul || 'R&B / Soul' },
    { id: 'rock', label: pageCopy?.filters?.rock || 'Rock' },
    { id: 'electronic', label: pageCopy?.filters?.electronic || 'Electronic' },
    { id: 'jazz', label: pageCopy?.filters?.jazz || 'Jazz' },
    { id: 'classical', label: pageCopy?.filters?.classical || 'Classical' },
    { id: 'world', label: pageCopy?.filters?.world || 'World Music' },
    { id: 'hip-hop', label: pageCopy?.filters?.hipHop || 'Hip-Hop' },
    { id: 'folk-country', label: pageCopy?.filters?.folkCountry || 'Folk & Country' },
    { id: 'funk-disco-gospel', label: pageCopy?.filters?.funkDiscoGospel || 'Funk / Disco / Gospel' },
    { id: 'reggae-ska', label: pageCopy?.filters?.reggaeSka || 'Reggae / Ska' },
    { id: 'chinese-singers', label: pageCopy?.filters?.chineseSingers || 'Chinese Singers' },
  ];

  const categoryLabels = {
    pop: pageCopy?.categories?.pop || 'Pop',
    'rnb-soul': pageCopy?.categories?.rnbSoul || 'R&B / Soul',
    rock: pageCopy?.categories?.rock || 'Rock',
    electronic: pageCopy?.categories?.electronic || 'Electronic',
    jazz: pageCopy?.categories?.jazz || 'Jazz',
    classical: pageCopy?.categories?.classical || 'Classical',
    world: pageCopy?.categories?.world || 'World Music',
    'hip-hop': pageCopy?.categories?.hipHop || 'Hip-Hop',
    'folk-country': pageCopy?.categories?.folkCountry || 'Folk & Country',
    'funk-disco-gospel': pageCopy?.categories?.funkDiscoGospel || 'Funk / Disco / Gospel',
    'reggae-ska': pageCopy?.categories?.reggaeSka || 'Reggae / Ska',
    'chinese-singers': pageCopy?.categories?.chineseSingers || 'Chinese Singers',
  };

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return prompts.filter((item) => {
      const matchesFilter = activeFilter === 'all' || item.category === activeFilter;
      const searchableText = `${item.title} ${item.prompt} ${item.category}`.toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, prompts, query]);

  const copyPrompt = async (item) => {
    await navigator.clipboard.writeText(item.prompt);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  const importPrompt = async (item) => {
    if (!isSignedIn) {
      openSignIn?.();
      return;
    }

    setImportingId(item.id);
    try {
      const result = await apiClient.createPrompt({
        title: item.title,
        content: item.prompt,
        description: item.source
          ? `${pageCopy?.sourcePrefix || 'Source: '}${item.source}`
          : null,
        tags: item.category,
        version: '1.0.0',
      });

      if (result?.mode === 'approval_required' && result?.change_request?.id) {
        toast({
          title: pageCopy?.toasts?.importSuccessTitle || 'Import successful',
          description: pageCopy?.toasts?.approvalRequiredDescription || 'Approval request submitted',
        });
      } else {
        toast({
          title: pageCopy?.toasts?.importSuccessTitle || 'Import successful',
          description: pageCopy?.toasts?.importSuccessDescription || 'Prompt imported to your prompt library',
        });
      }
    } catch (error) {
      toast({
        title: pageCopy?.toasts?.importErrorTitle || 'Import failed',
        description: error.message || pageCopy?.toasts?.importErrorDescription || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-slate-950">
      <section className="border-b border-slate-200 bg-[#fbfaf7]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.72fr)] lg:px-12 lg:py-16">
          <div className="flex flex-col justify-between gap-12">
            <div className="max-w-3xl space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Sparkles className="h-3.5 w-3.5" />
                {pageCopy?.badge || 'Suno Prompt Library'}
              </div>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                  {pageCopy?.title || 'Suno Music Prompt Templates'}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  {pageCopy?.description ||
                    'Filter, copy, and import Suno style prompt templates extracted from the article into your prompt library.'}
                </p>
              </div>
            </div>

            <div className="grid max-w-2xl grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-5">
              <Metric value={prompts.length} label={pageCopy?.metrics?.cases || 'Cases'} />
              <Metric
                value={filters.length - 1}
                label={pageCopy?.metrics?.categories || 'Categories'}
              />
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden rounded-lg border border-slate-200 bg-white">
            <Image
              src={getPromptImageSrc(featuredPrompt)}
              alt={`${featuredPrompt?.title || 'Suno prompt'} 示例图`}
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/12 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                {pageCopy?.featuredSample || 'Featured prompt'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                {featuredPrompt?.title || 'Suno'}
              </h2>
              <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-white/78">
                {featuredPrompt?.prompt || ''}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        <div className="sticky top-16 z-20 -mx-5 border-b border-slate-200 bg-[#f7f7f4]/92 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    'h-9 shrink-0 rounded-md border px-4 text-sm font-medium transition-colors',
                    activeFilter === filter.id
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <span className="sr-only">{pageCopy?.searchSrOnly || 'Search prompts'}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={pageCopy?.searchPlaceholder || 'Search title, category, or prompt'}
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
              />
            </label>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPrompts.map((item) => (
            <article
              key={item.id}
              className="group flex min-h-[650px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300"
              onMouseEnter={() => setFeaturedPrompt(item)}
            >
              <button
                type="button"
                onClick={() => setFeaturedPrompt(item)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left"
                aria-label={(pageCopy?.previewAriaLabel || 'Preview {title}').replace('{title}', item.title)}
              >
                <Image
                  src={getPromptImageSrc(item)}
                  alt={`${item.title} 示例图`}
                  fill
                  sizes="(min-width: 1280px) 31vw, (min-width: 768px) 48vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                />
              </button>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {categoryLabels[item.category] || item.category}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-slate-950">
                      {item.title}
                    </h2>
                  </div>
                  <ImageIcon className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
                </div>

                <div className="mt-5 flex-1 rounded-md border border-slate-200 bg-slate-50">
                  <p className="h-52 overflow-y-auto whitespace-pre-wrap px-4 py-3 text-sm leading-6 text-slate-600 [scrollbar-width:thin]">
                    {item.prompt}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyPrompt(item)}
                    className="h-10 rounded-md border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  >
                    {copiedId === item.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedId === item.id ? pageCopy?.buttons?.copied || 'Copied' : pageCopy?.buttons?.copy || 'Copy'}
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => importPrompt(item)}
                    disabled={importingId === item.id}
                    className="h-10 rounded-md border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white"
                  >
                    <Import className="h-4 w-4" />
                    {importingId === item.id
                      ? pageCopy?.buttons?.importing || 'Importing...'
                      : pageCopy?.buttons?.import || 'Import'}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="my-16 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-base font-medium text-slate-900">
              {pageCopy?.emptyState?.title || 'No matching prompts'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {pageCopy?.emptyState?.description || 'Try another keyword or switch to all categories.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="px-5 first:pl-0">
      <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

