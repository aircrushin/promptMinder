"use client";

import { motion } from "framer-motion";
import {
  FolderOpenIcon,
  ArrowPathIcon,
  UsersIcon,
  CpuChipIcon,
  LockClosedIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

// Base data for features, including icon components and default English text.
const baseFeatureData = [
  {
    defaultTitle: "Smart Category Management",
    defaultDescription: "Organize prompts efficiently with intuitive categories and tags for quick access.",
    IconComponent: FolderOpenIcon
  },
  {
    defaultTitle: "Version Control",
    defaultDescription: "Track every change. Revert to previous prompt versions easily with a single click.", // Corrected typo
    IconComponent: ArrowPathIcon
  },
  {
    defaultTitle: "Team Collaboration",
    defaultDescription: "Share, discuss, and refine prompts with your team in a centralized workspace.",
    IconComponent: UsersIcon
  },
  {
    defaultTitle: "AI Model Support",
    defaultDescription: "Seamlessly integrate with various AI models. Use your prompts where you need them.",
    IconComponent: CpuChipIcon
  },
  {
    defaultTitle: "Data Security",
    defaultDescription: "Enterprise-level data encryption ensures your prompts and sensitive data are always protected.",
    IconComponent: LockClosedIcon
  },
  {
    defaultTitle: "Prompt Optimization",
    defaultDescription: "Leverage built-in tools and suggestions to enhance the effectiveness of your prompts.",
    IconComponent: LightBulbIcon
  },
];

const FeatureGridOrnament = () => (
  <svg
    aria-hidden="true"
    className="absolute -right-20 top-12 hidden lg:block h-48 w-48 text-black/10"
    viewBox="0 0 200 200"
  >
    <rect x="0" y="0" width="200" height="200" fill="none" stroke="currentColor" strokeWidth=".5" />
    <line x1="0" y1="0" x2="200" y2="200" stroke="currentColor" strokeWidth=".5" />
    <line x1="200" y1="0" x2="0" y2="200" stroke="currentColor" strokeWidth=".5" />
    <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth=".5" />
  </svg>
);

export function FeatureSection({ t }) {
  const sectionTitle = (t && t.title) || "Powerful and Simple Features";
  const sectionDescription =
    (t && t.description) || "Providing you with a one-stop prompt management solution";

  const translatedItems = t && Array.isArray(t.items) ? t.items : [];

  const featuresToRender = baseFeatureData.map((baseFeature, index) => {
    const translatedItem = translatedItems[index] || {};
    return {
      title: translatedItem.title || baseFeature.defaultTitle,
      description: translatedItem.description || baseFeature.defaultDescription,
      Icon: baseFeature.IconComponent,
    };
  });

  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      </div>
      <FeatureGridOrnament />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="text-sm font-mono uppercase tracking-[0.4em] text-neutral-500">
            Features
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
            {sectionTitle}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600">
            {sectionDescription}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuresToRender.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative flex h-full flex-col rounded-3xl border border-black/10 bg-white p-8 text-left shadow-[0_20px_45px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <feature.Icon className="h-5 w-5" />
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-black/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-2xl font-semibold text-neutral-900">{feature.title}</h3>
                <p className="text-base leading-relaxed text-neutral-600">{feature.description}</p>
              </div>

              <div className="mt-auto pt-8">
                <div className="h-px w-full bg-black/10" />
                <div className="mt-4 flex items-center text-sm font-medium text-neutral-500">
                  <span className="mr-2 h-1 w-1 rounded-full bg-neutral-500" />
                  Thoughtfully crafted workflow
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
