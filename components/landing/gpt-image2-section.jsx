'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ImageIcon, Music2, Sparkles } from 'lucide-react';
import { gptImage2Prompts } from '@/app/gpt-image2/data';
import { sunoPrompts } from '@/app/suno/data';

const previewImages = [
  { id: 'cinematic-minimal-portrait', className: 'col-span-2 row-span-2' },
  { id: 'vintage-amalfi-travel-poster' },
  { id: 'chengdu-food-map-illustration' },
];

const sunoPreviewIds = ['pop', 'rnb', 'lo-fi'];

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

const waveformHeights = [28, 46, 34, 58, 40, 52, 30, 62, 38, 48, 26, 54, 42, 60, 32, 50];

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
    <section className="relative overflow-hidden bg-slate-50/50 py-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] bg-indigo-500/8 blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] bg-blue-500/8 blur-[120px]" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(460px,0.94fr)] lg:gap-14 lg:items-center">
          <div className="flex flex-col justify-center gap-8">
            <div className="space-y-5">
              <motion.div variants={itemVariants}>
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {badge}
                </span>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="max-w-2xl text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl"
              >
                <span className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                  {title}
                </span>
              </motion.h2>

              <motion.p
                variants={itemVariants}
                className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
              >
                {description}
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-2.5">
              {pageCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm shadow-slate-200/40"
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
                description={
                  collections.gptImage2Description ||
                  'Reference images, full prompts, and reusable visual directions.'
                }
              />
              <CollectionLink
                href="/suno"
                icon={Music2}
                eyebrow={collections.sunoEyebrow || 'Music prompts'}
                title={collections.sunoTitle || 'Suno'}
                description={
                  collections.sunoDescription ||
                  'Genre, mood, BPM, and production-ready music prompt templates.'
                }
              />
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative min-h-[560px] sm:min-h-[620px]">
            <span className="absolute left-4 top-2 z-30 inline-flex items-center rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600 shadow-sm backdrop-blur-sm">
              {featuredLabel}
            </span>

            <div className="absolute left-0 top-10 z-10 w-[74%] [perspective:1000px]">
              <TiltCard
                baseRotateX={5}
                baseRotateY={-8}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-indigo-600">
                      <ImageIcon className="h-3.5 w-3.5" />
                    </span>
                    {collections.gptImage2Title || 'GPT Image2'}
                  </div>
                  <span className="text-xs text-slate-500">{gptImage2Prompts.length} prompts</span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {images.map((item) => (
                    <div
                      key={item.id}
                      className={`group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ${item.className || ''}`}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 180px, 30vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                      <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-[11px] font-semibold leading-tight text-white">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              </TiltCard>
            </div>

            <div className="absolute bottom-4 right-0 z-20 w-[76%] [perspective:1000px]">
              <TiltCard
                baseRotateX={-4}
                baseRotateY={8}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_28px_64px_rgba(15,23,42,0.14)]"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
                      <Music2 className="h-3.5 w-3.5" />
                    </span>
                    {collections.sunoTitle || 'Suno'}
                  </div>
                  <span className="text-xs text-slate-500">{sunoPrompts.length} templates</span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex h-16 items-end gap-1 border-b border-slate-100 pb-3">
                    {waveformHeights.map((height, index) => (
                      <span
                        key={index}
                        className="w-full rounded-t-sm bg-gradient-to-t from-indigo-500/80 to-indigo-300/70"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className="grid gap-2">
                    {sunoSamples.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <span className="shrink-0 rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                            {item.category}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {item.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function TiltCard({
  children,
  className,
  baseRotateX = 0,
  baseRotateY = 0,
  maxTilt = 10,
}) {
  const ref = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateXSpring = useSpring(
    useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]),
    springConfig
  );
  const rotateYSpring = useSpring(
    useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]),
    springConfig
  );
  const rotateX = useTransform(rotateXSpring, (value) => value + baseRotateX);
  const rotateY = useTransform(rotateYSpring, (value) => value + baseRotateY);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(pointer: fine)');

    function updateEnabled() {
      setEnabled(!motionQuery.matches && pointerQuery.matches);
    }

    updateEnabled();
    motionQuery.addEventListener('change', updateEnabled);
    pointerQuery.addEventListener('change', updateEnabled);

    return () => {
      motionQuery.removeEventListener('change', updateEnabled);
      pointerQuery.removeEventListener('change', updateEnabled);
    };
  }, []);

  function handleMove(event) {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={enabled ? { scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{
        rotateX: enabled ? rotateX : baseRotateX,
        rotateY: enabled ? rotateY : baseRotateY,
        transformStyle: 'preserve-3d',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CollectionLink({ href, icon: Icon, eyebrow, title, description }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-200/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-md hover:shadow-indigo-500/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600 transition-colors group-hover:border-indigo-100 group-hover:bg-indigo-50">
          <Icon className="h-4 w-4" />
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}
