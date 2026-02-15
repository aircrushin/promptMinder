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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

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
    <section className="relative overflow-hidden bg-slate-50/50 py-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute left-0 top-0 -z-10 h-[600px] w-[600px] bg-indigo-500/8 blur-[120px]" />
      <div className="absolute bottom-0 right-0 -z-10 h-[600px] w-[600px] bg-blue-500/8 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <motion.h2 
            variants={titleVariants}
            className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent"
          >
            {sectionTitle}
          </motion.h2>
          <motion.p 
            variants={titleVariants}
            className="mt-6 text-lg leading-relaxed text-slate-600"
          >
            {sectionDescription}
          </motion.p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {featuresToRender.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 p-8 text-left shadow-lg shadow-indigo-500/5 backdrop-blur-xl transition-all duration-300 hover:border-indigo-200/80 hover:bg-white/90 hover:shadow-2xl hover:shadow-indigo-500/15"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-indigo-50/0 to-indigo-100/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative">
                <motion.div 
                  className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/25"
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <feature.Icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
                </motion.div>

                <h3 className="text-xl font-bold text-slate-900 transition-colors duration-300 group-hover:text-indigo-700">{feature.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{feature.description}</p>
              </div>

              {/* Hover indicator line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
