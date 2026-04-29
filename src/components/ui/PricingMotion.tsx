"use client";

/**
 * PricingMotion — wraps a single pricing card in a spring reveal.
 * Pass `index` (0, 1, 2) to stagger cards 100 ms apart.
 */

import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  index: number;
}

export default function PricingMotion({ children, index }: Props) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        type:      "spring",
        stiffness: 50,
        damping:   20,
        delay:     index * 0.1,
      }}
    >
      {children}
    </motion.div>
  );
}
