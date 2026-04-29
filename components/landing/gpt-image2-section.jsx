'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gptImage2Prompts } from '@/app/gpt-image2/data';

const previewImages = [
  { id: 'cinematic-minimal-portrait', className: 'md:col-span-2 md:row-span-2' },
  { id: 'vintage-amalfi-travel-poster' },
  { id: 'futuristic-mandala-illustration' },
  { id: 'poster-case6' },
  { id: 'chengdu-food-map-illustration' },
];

const pageCategories = ['portrait', 'poster', 'illustration', 'typography'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

export function GptImage2Section({ t }) {
  const badge = t?.badge || 'GPT Image 2 Prompt Library';
  const title = t?.title || 'GPT Image 2 Prompts Library';
  const description =
    t?.description ||
    'Browse a curated gallery of GPT Image 2 prompts with sample images. Filter, copy, and import directly into your prompt library.';
  const ctaButton = t?.ctaButton || 'Explore All Cases';
  const categoryLabel = t?.categories || {};
  const metricsLabel = t?.metrics || {};
  const featuredLabel = t?.featured || 'Featured';
  const ctaAriaLabel = t?.ctaAriaLabel || 'View GPT Image 2 prompt gallery';

  const images = previewImages
    .map((item) => {
      const prompt = gptImage2Prompts.find((p) => p.id === item.id);
      return prompt ? { ...item, ...prompt } : null;
    })
    .filter(Boolean);

  return (
    <section className="relative overflow-hidden bg-white py-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 bg-gradient-to-b from-amber-200/15 via-orange-100/10 to-transparent blur-[120px]" />
      <div className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] bg-purple-300/8 blur-[120px]" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative mx-auto max-w-6xl px-6"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)] lg:gap-16">
          <div className="flex flex-col justify-center gap-10">
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {badge}
                </span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl bg-gradient-to-br from-slate-900 via-amber-800 to-slate-900 bg-clip-text text-transparent"
              >
                {title}
              </motion.h2>

              <motion.p variants={itemVariants} className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                {description}
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              {pageCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {categoryLabel[cat] || cat}
                </span>
              ))}
            </motion.div>

            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <motion.div variants={itemVariants} className="flex gap-10 border-y border-slate-200 py-5">
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">{gptImage2Prompts.length}</div>
                  <div className="text-sm text-slate-500">{metricsLabel.cases || 'Cases'}</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">{pageCategories.length}</div>
                  <div className="text-sm text-slate-500">{metricsLabel.categories || 'Categories'}</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">6</div>
                  <div className="text-sm text-slate-500">{metricsLabel.xPosts || 'X Posts'}</div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  asChild
                  size="lg"
                  className="group gap-2 rounded-full bg-slate-900 px-7 text-base font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20"
                >
                  <Link href="/gpt-image2" aria-label={ctaAriaLabel}>
                    {ctaButton}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>

          <motion.div
            variants={itemVariants}
            className="relative"
          >
            <span className="absolute left-4 top-4 z-10 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              {featuredLabel}
            </span>
            <div className="grid grid-cols-3 gap-3">
              {images.map((item) => (
                <div
                  key={item.id}
                  className={`group relative overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-300/50 ${item.className || ''}`}
                >
                  <div className="relative aspect-[3/4] sm:aspect-[4/5]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="inline-flex rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {categoryLabel[item.category] || item.category}
                    </span>
                    <p className="mt-1 text-[11px] font-semibold leading-tight text-white line-clamp-2">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
