"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChatBubbleOvalLeftIcon } from "@heroicons/react/24/solid";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
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
    <section className="relative overflow-hidden bg-slate-50/50 py-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute left-1/4 top-0 -z-10 h-[400px] w-[400px] bg-indigo-500/10 blur-[100px]" />
      <div className="absolute right-1/4 bottom-0 -z-10 h-[400px] w-[400px] bg-purple-500/10 blur-[100px]" />
      
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
            {translations.title}
          </motion.h2>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.author}-${index}`}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 p-8 shadow-lg shadow-indigo-500/5 backdrop-blur-xl transition-all duration-300 hover:border-indigo-200/80 hover:bg-white/90 hover:shadow-2xl hover:shadow-indigo-500/15"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-indigo-50/0 to-indigo-100/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative">
                <ChatBubbleOvalLeftIcon className="mb-4 h-8 w-8 text-indigo-200 transition-colors duration-300 group-hover:text-indigo-300" />
                <p className="text-lg leading-relaxed text-slate-700 font-medium">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </div>
              
              <div className="relative mt-8 flex items-center gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-indigo-50 shadow-md"
                >
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    fill
                    sizes="48px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-slate-900 transition-colors duration-300 group-hover:text-indigo-700">{testimonial.author}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-indigo-600/80">{testimonial.title}</p>
                </div>
              </div>

              {/* Decorative gradient line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
