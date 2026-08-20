import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function Reveal({ children, className, delay = 0, y = 14, viewportReveal = false, ...props }) {
  const reduceMotion = useReducedMotion();
  const visible = { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      animate={viewportReveal ? undefined : visible}
      whileInView={viewportReveal ? visible : undefined}
      viewport={viewportReveal ? { once: true, amount: 0.14, margin: "0px 0px -60px" } : undefined}
      transition={{ duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, delay = 0.08, viewportReveal = false, ...props }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      animate={viewportReveal ? undefined : "visible"}
      whileInView={viewportReveal ? "visible" : undefined}
      viewport={viewportReveal ? { once: true, amount: 0.12, margin: "0px 0px -50px" } : undefined}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: reduceMotion ? 0 : 0.07,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduceMotion ? {} : { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
