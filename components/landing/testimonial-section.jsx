"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const QuoteMarks = () => (
  <svg
    aria-hidden="true"
    className="absolute left-10 top-10 h-20 w-20 text-black/5"
    viewBox="0 0 100 100"
  >
    <path
      d="M20 20 h20 v20 h-10 v20 h-10z"
      fill="currentColor"
    />
    <path
      d="M60 20 h20 v20 h-10 v20 h-10z"
      fill="currentColor"
    />
  </svg>
);

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
    <section className="relative overflow-hidden bg-neutral-50 py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      <QuoteMarks />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="text-sm font-mono uppercase tracking-[0.4em] text-neutral-500">
            Voices
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
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
              className="group relative flex h-full flex-col justify-between rounded-3xl border border-black/10 bg-white p-8 text-left shadow-[0_20px_45px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1.5"
            >
              <span className="text-6xl font-serif text-black/5">&rdquo;</span>
              <p className="mt-4 text-base leading-relaxed text-neutral-700">
                {testimonial.content}
              </p>
              <div className="mt-8 flex items-center gap-4 border-t border-black/10 pt-6">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-black/10 bg-neutral-100">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    fill
                    sizes="48px"
                    className="object-cover filter grayscale"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{testimonial.author}</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
