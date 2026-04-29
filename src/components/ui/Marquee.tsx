"use client";

/**
 * Marquee — infinite horizontal scrolling strip.
 *
 * Renders `copies` copies of children in two equal strips so the
 * -50% translateX trick creates a seamless, gapless loop.
 *
 * Pauses on hover so the user can read the content.
 */

import { motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect } from "react";

interface MarqueeProps {
  children:  React.ReactNode;
  /** Total seconds for one full loop cycle */
  duration?: number;
  /** How many copies of `children` per strip — increase for very wide screens */
  copies?:   number;
}

export default function Marquee({ children, duration = 22, copies = 5 }: MarqueeProps) {
  const controls = useAnimationControls();

  // Animate from 0 → -50% of the element's own width.
  // Because we render copies × 2 items (strip A + strip B),
  // -50% = exactly one strip width → seamless loop.
  const run = useCallback(() => {
    controls.start({
      x: ["0%", "-50%"],
      transition: {
        duration,
        ease:       "linear",
        repeat:     Infinity,
        repeatType: "loop",
      },
    });
  }, [controls, duration]);

  useEffect(() => { run(); }, [run]);

  return (
    <div
      className="overflow-hidden cursor-default"
      onMouseEnter={() => controls.stop()}
      onMouseLeave={run}
    >
      <motion.div
        animate={controls}
        initial={{ x: "0%" }}
        className="flex w-max"
      >
        {/* Strip A */}
        {Array.from({ length: copies }, (_, i) => (
          <span key={`a${i}`} className="flex-shrink-0">{children}</span>
        ))}
        {/* Strip B — seamless duplicate */}
        {Array.from({ length: copies }, (_, i) => (
          <span key={`b${i}`} className="flex-shrink-0" aria-hidden="true">{children}</span>
        ))}
      </motion.div>
    </div>
  );
}
