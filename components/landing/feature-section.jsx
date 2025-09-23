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
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/40 to-white py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-12 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[140px]" />
        <div className="absolute -bottom-24 right-10 h-80 w-80 rounded-full bg-indigo-400/15 blur-[160px]" />
        <div className="absolute -left-16 bottom-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            {sectionTitle}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
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
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-8 text-left shadow-xl shadow-blue-200/40 backdrop-blur transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-700 text-white shadow-md shadow-blue-500/40">
                  <feature.Icon className="h-6 w-6" />
                </span>
              </div>

              <h3 className="mt-8 text-2xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">{feature.description}</p>

              <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
