"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children:  ReactNode;
  className?: string;
  /** Delay in seconds before this element's animation starts (for staggering) */
  delay?:    number;
  /** "fadeUp" (default) | "scaleIn" */
  variant?:  "fadeUp" | "scaleIn";
}

const variants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],   // custom spring-like ease
      },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.93 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },
};

export default function ScrollReveal({
  children,
  className,
  delay   = 0,
  variant = "fadeUp",
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={variants[variant]}
      transition={{ delay }}   // layered on top of the variant's own transition
    >
      {children}
    </motion.div>
  );
}
