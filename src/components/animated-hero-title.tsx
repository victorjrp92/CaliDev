"use client";

import { motion } from "motion/react";

export function AnimatedHeroTitle() {
  const title = "Lets Build Your Future";
  const words = title.split(" ");

  return (
    <h1 className="mb-4 text-6xl font-black tracking-tighter leading-none sm:text-8xl md:text-9xl">
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="mr-6 inline-block last:mr-0">
          {word.split("").map((letter, letterIndex) => (
            <motion.span
              key={`${wordIndex}-${letterIndex}`}
              initial={{ y: 100, opacity: 0, rotateX: -90 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{
                delay: wordIndex * 0.15 + letterIndex * 0.05,
                type: "spring",
                stiffness: 100,
                damping: 20,
                duration: 0.8,
              }}
              className="inline-block cursor-default bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent transition-all duration-700 hover:from-emerald-300 hover:via-green-400 hover:to-teal-500"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
}
