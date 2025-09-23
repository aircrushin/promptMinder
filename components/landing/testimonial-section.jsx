"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function TestimonialSection({ t }) {
  const translations =
    t || {
      title: "Loved by Millions of Users",
      items: [
        {
          content: "This is a very simple way to iterate and manage prompts.",
          author: "IndieAI",
          title: "AI Indie Developer",
        },
        {
          content: "Prompt Minder is really great, simple but not simplistic.",
          author: "Xiao Rui",
          title: "Prompt Engineer",
        },
        {
          content: "Prompt Minder creates a great debugging environment.",
          author: "aircrushin",
          title: "AI Enthusiast",
        },
      ],
    };

  const testimonials = translations.items.map((item, index) => ({
    ...item,
    avatar: [
      `https://api.dicebear.com/7.x/bottts/svg?seed=123`,
      `https://api.dicebear.com/7.x/pixel-art/svg?seed=456`,
      `https://api.dicebear.com/7.x/fun-emoji/svg?seed=789`,
    ][index % 3],
  }));

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-20 h-64 w-[30rem] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-[140px]" />
        <div className="absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-blue-400/15 blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            {translations.title}
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.author}-${index}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/50 bg-white/85 p-8 shadow-xl shadow-blue-200/40 backdrop-blur transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <p className="text-base leading-relaxed text-slate-700">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-blue-100/70 bg-blue-50">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{testimonial.author}</p>
                  <p className="text-xs uppercase tracking-wide text-blue-600/80">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
