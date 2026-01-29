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
    <section className="relative overflow-hidden bg-slate-50/50 py-24">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            {translations.title}
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.author}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 p-8 shadow-xl shadow-indigo-500/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:bg-white/80"
            >
              <p className="text-lg leading-relaxed text-slate-700 font-medium">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-indigo-50 shadow-sm">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{testimonial.author}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-indigo-600/80">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
