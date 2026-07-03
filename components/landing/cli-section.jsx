"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Clipboard,
  ExternalLink,
  Terminal,
} from "lucide-react";

const DEFAULT_TRANSLATIONS = {
  badge: "Developer Tools",
  title: "One command to rule your prompts",
  description:
    "Manage prompts straight from the terminal with PromptMinder CLI. Integrate into any workflow or CI/CD pipeline in seconds.",
  copied: "Copied!",
  commands: [
    {
      key: "install-cli",
      label: "Step 1 · Install CLI",
      command: "npm install -g @aircrushin/promptminder-cli",
      copyLabel: "Copy CLI install command",
    },
    {
      key: "install-skill",
      label: "Step 2 · Install Agent Skill",
      command: "npx skills add aircrushin/promptminder-cli-skill",
      copyLabel: "Copy skill install command",
    },
  ],
  terminalTitle: "Terminal",
  features: [
    { label: "Prompt Management", desc: "CRUD operations with full version history" },
    { label: "Tag Management", desc: "Bulk create and organize tags" },
    { label: "Team Collaboration", desc: "Cross-team sharing and permissions" },
    { label: "Agent Integration", desc: "Built-in agent mode for automation" },
  ],
  npmLink: "View on npm",
  docsLink: "Documentation",
  version: "v0.1.2 · MIT License",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  },
};

const terminalLines = [
  { prompt: "$", command: "promptminder login", delay: 0 },
  { prompt: "✓", command: "Authenticated successfully", isOutput: true, delay: 0.4 },
  { prompt: "$", command: "promptminder prompts list", delay: 0.8 },
  { prompt: "✓", command: "Fetched 42 prompts", isOutput: true, delay: 1.2 },
  { prompt: "$", command: "promptminder prompt create --title \"My Prompt\" --content \"Hello\"", delay: 1.6 },
  { prompt: "✓", command: "Created prompt · My Prompt", isOutput: true, delay: 2.0 },
];

export function CLISection({ t }) {
  const tr = { ...DEFAULT_TRANSLATIONS, ...(t || {}) };
  const features = Array.isArray(tr.features) && tr.features.length
    ? tr.features
    : DEFAULT_TRANSLATIONS.features;
  const commands = Array.isArray(tr.commands) && tr.commands.length
    ? tr.commands
    : DEFAULT_TRANSLATIONS.commands;

  const [copiedKey, setCopiedKey] = useState(null);

  function handleCopy(commandKey, command) {
    navigator.clipboard.writeText(command).then(() => {
      setCopiedKey(commandKey);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }

  return (
    <section className="relative overflow-hidden bg-slate-50/50 py-28">
      {/* Grid pattern — identical to feature-section */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      {/* Ambient blurs */}
      <div className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] bg-indigo-500/8 blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] bg-blue-500/8 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-16 lg:grid-cols-2 lg:items-center"
        >
          {/* ── Left: text + install box + feature pills ── */}
          <div>
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 shadow-sm">
                <Terminal className="h-3.5 w-3.5" />
                {tr.badge}
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h2
              variants={itemVariants}
              className="mb-5 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl"
            >
              <span className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                {tr.title}
              </span>
            </motion.h2>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="mb-8 text-lg leading-relaxed text-slate-600"
            >
              {tr.description}
            </motion.p>

            {/* Install command boxes */}
            <motion.div
              variants={itemVariants}
              className="mb-10 space-y-4"
            >
              {commands.map((item) => {
                const isCopied = copiedKey === item.key;

                return (
                  <div
                    key={item.key}
                    className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 shadow-lg shadow-indigo-500/5 backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 px-5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </p>
                      <button
                        onClick={() => handleCopy(item.key, item.command)}
                        aria-label={item.copyLabel}
                        title={item.copyLabel}
                        className="group inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Clipboard className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        )}
                      </button>
                    </div>
                    <div className="flex">
                      <div className="flex flex-1 items-center gap-3 px-5 py-4">
                        <span className="select-none font-mono text-base font-semibold text-indigo-500">$</span>
                        <code className="flex-1 select-all break-all font-mono text-sm text-slate-800 sm:text-base">
                          {item.command}
                        </code>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Links */}
            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="https://www.npmjs.com/package/@aircrushin/promptminder-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-700 hover:underline"
              >
                {tr.npmLink}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="h-4 w-px bg-slate-200" />
              <a
                href="https://github.com/aircrushin/promptMinder/tree/main/packages/promptminder-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-700 hover:underline"
              >
                {tr.docsLink}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          </div>

          {/* ── Right: terminal window card ── */}
          <motion.div variants={itemVariants} className="relative">
            {/* Soft glow behind card */}
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-indigo-500/8 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
              {/* macOS-style title bar */}
              <div className="flex items-center gap-2 border-b border-slate-200/60 bg-slate-50/80 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400/90" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/90" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/90" />
                <span className="ml-3 text-xs font-medium text-slate-400">
                  {tr.terminalTitle} — promptminder
                </span>
              </div>

              {/* Terminal body — kept dark for authentic terminal feel */}
              <div className="bg-slate-900 p-6">
                <div className="space-y-1 font-mono text-sm leading-relaxed">
                  {terminalLines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: line.delay, duration: 0.4 }}
                      className="flex items-baseline gap-3"
                    >
                      <span
                        className={
                          line.isOutput
                            ? "select-none text-emerald-400"
                            : "select-none text-indigo-400"
                        }
                      >
                        {line.prompt}
                      </span>
                      <span
                        className={
                          line.isOutput ? "text-emerald-300/80" : "text-slate-200"
                        }
                      >
                        {line.command}
                      </span>
                    </motion.div>
                  ))}

                  {/* Blinking cursor */}
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 2.4 }}
                  >
                    <span className="select-none text-indigo-400">$</span>
                    <motion.span
                      className="inline-block h-4 w-2 rounded-sm bg-indigo-400"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
