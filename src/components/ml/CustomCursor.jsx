import React from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [enabled, setEnabled] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [interactive, setInteractive] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateCapability = () => {
      setEnabled(mediaQuery.matches && !reducedMotion.matches && window.innerWidth >= 1024);
    };

    updateCapability();
    mediaQuery.addEventListener("change", updateCapability);
    reducedMotion.addEventListener("change", updateCapability);
    window.addEventListener("resize", updateCapability);

    return () => {
      mediaQuery.removeEventListener("change", updateCapability);
      reducedMotion.removeEventListener("change", updateCapability);
      window.removeEventListener("resize", updateCapability);
    };
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      setVisible(false);
      setInteractive(false);
      return undefined;
    }

    const updateCursor = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      setPosition({ x: event.clientX, y: event.clientY });
      setVisible(true);
      setInteractive(Boolean(target?.closest("a, button, input, textarea, label, [role='button'], .cursor-target")));
    };

    const hideCursor = () => setVisible(false);

    window.addEventListener("mousemove", updateCursor);
    window.addEventListener("mouseout", hideCursor);
    window.addEventListener("blur", hideCursor);

    return () => {
      window.removeEventListener("mousemove", updateCursor);
      window.removeEventListener("mouseout", hideCursor);
      window.removeEventListener("blur", hideCursor);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[70] hidden lg:block"
        animate={{
          x: position.x - 18,
          y: position.y - 18,
          opacity: visible ? 1 : 0,
          scale: interactive ? 1.35 : 1,
        }}
        transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.22 }}
      >
        <div className="h-9 w-9 rounded-full border border-primary/45 bg-primary/10 shadow-[0_0_30px_rgba(59,130,246,0.18)] backdrop-blur-sm" />
      </motion.div>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[71] hidden lg:block"
        animate={{
          x: position.x - 4,
          y: position.y - 4,
          opacity: visible ? 1 : 0,
          scale: interactive ? 0.75 : 1,
        }}
        transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.14 }}
      >
        <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_20px_rgba(45,212,191,0.55)]" />
      </motion.div>
    </>
  );
}
