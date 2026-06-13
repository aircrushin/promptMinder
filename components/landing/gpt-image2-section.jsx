'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ImageIcon, Library, Music2, Sparkles } from 'lucide-react';
import { gptImage2Prompts } from '@/app/gpt-image2/data';
import { sunoPrompts } from '@/app/suno/data';

const previewImages = [
  { id: 'cinematic-minimal-portrait', className: 'col-span-2 row-span-2' },
  { id: 'vintage-amalfi-travel-poster' },
  { id: 'chengdu-food-map-illustration' },
];

const sunoPreviewIds = ['pop', 'rnb', 'cinematic-film-score', 'lo-fi'];

const pageCategories = ['imagePrompts', 'musicPrompts', 'copyReady', 'importReady'];

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
  const badge = t?.badge || 'Prompt Collections';
  const title = t?.title || 'GPT Image2 + Suno Prompts';
  const description =
    t?.description ||
    'A focused landing section for image and music prompt collections. Browse visual GPT Image2 prompts and Suno music prompt templates, then reuse or import them into your library.';
  const categoryLabel = t?.categories || {};
  const featuredLabel = t?.featured || 'Dual prompt library';
  const collections = t?.collections || {};

  const images = previewImages
    .map((item) => {
      const prompt = gptImage2Prompts.find((p) => p.id === item.id);
      return prompt ? { ...item, ...prompt } : null;
    })
    .filter(Boolean);
  const sunoSamples = sunoPreviewIds
    .map((id) => sunoPrompts.find((prompt) => prompt.id === id))
    .filter(Boolean);

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-[#fbfaf7] py-24 sm:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a06_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute left-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_22%_20%,rgba(245,158,11,0.12),transparent_34%)]" />
      <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_72%_66%,rgba(20,184,166,0.10),transparent_38%)]" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(460px,0.94fr)] lg:gap-14">
          <div className="flex flex-col justify-center gap-9">
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm shadow-slate-200/40">
                <Sparkles className="h-3.5 w-3.5 text-slate-700" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {badge}
                </span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-6xl"
              >
                {title}
              </motion.h2>

              <motion.p variants={itemVariants} className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {description}
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              {pageCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  {categoryLabel[cat] || cat}
                </span>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-2">
              <CollectionLink
                href="/gpt-image2"
                icon={ImageIcon}
                eyebrow={collections.gptImage2Eyebrow || 'Visual prompts'}
                title={collections.gptImage2Title || 'GPT Image2'}
                description={collections.gptImage2Description || 'Reference images, full prompts, and reusable visual directions.'}
              />
              <CollectionLink
                href="/suno"
                icon={Music2}
                eyebrow={collections.sunoEyebrow || 'Music prompts'}
                title={collections.sunoTitle || 'Suno'}
                description={collections.sunoDescription || 'Genre, mood, BPM, and production-ready music prompt templates.'}
              />
            </motion.div>

          </div>

          <motion.div
            variants={itemVariants}
            className="relative min-h-[620px]"
          >
            <span className="absolute left-4 top-4 z-20 rounded-md border border-white/40 bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              {featuredLabel}
            </span>

            <div className="absolute left-0 top-8 w-[72%] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ImageIcon className="h-4 w-4" />
                  {collections.gptImage2Title || 'GPT Image2'}
                </div>
                <span className="text-xs text-slate-500">{gptImage2Prompts.length} prompts</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative aspect-square overflow-hidden rounded-md bg-slate-100 ${item.className || ""}`}
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 180px, 30vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/62 via-transparent to-transparent" />
                    <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-[11px] font-semibold leading-tight text-white">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-6 right-0 w-[74%] overflow-hidden rounded-lg border border-slate-200 bg-[#101114] text-white shadow-2xl shadow-slate-400/30">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Music2 className="h-4 w-4 text-teal-200" />
                  {collections.sunoTitle || 'Suno'}
                </div>
                <span className="text-xs text-white/52">{sunoPrompts.length} templates</span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex h-20 items-end gap-1.5 border-b border-white/10 pb-4">
                  {Array.from({ length: 32 }).map((_, index) => (
                    <span
                      key={index}
                      className="w-full rounded-t-sm bg-teal-200/80"
                      style={{ height: `${22 + ((index * 17) % 54)}px` }}
                    />
                  ))}
                </div>
                <div className="grid gap-2">
                  {sunoSamples.map((item) => (
                    <div key={item.id} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <span className="shrink-0 rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/56">
                          {item.category}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/58">{item.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-8 hidden w-40 rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/30 sm:block">
              <Library className="h-4 w-4 text-slate-500" />
              <p className="mt-3 text-sm font-semibold leading-5 text-slate-950">
                {collections.importNote || 'Save both formats in one prompt library.'}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function CollectionLink({ href, icon: Icon, eyebrow, title, description }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-900" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}
