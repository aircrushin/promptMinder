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

const baseFeatureData = [
  {
    defaultTitle: "Smart Category Management",
    defaultDescription: "Organize prompts efficiently with intuitive categories and tags for quick access.",
    IconComponent: FolderOpenIcon
  },
  {
    defaultTitle: "Version Control",
    defaultDescription: "Track every change. Revert to previous prompt versions easily with a single click.",
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
    <section className="relative overflow-hidden bg-slate-50/50 py-24">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute left-0 top-0 -z-10 h-[500px] w-[500px] bg-indigo-500/5 blur-[100px]" />
      <div className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] bg-blue-500/5 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 p-8 text-left shadow-xl shadow-indigo-500/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:bg-white/80"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <feature.Icon className="h-7 w-7" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
