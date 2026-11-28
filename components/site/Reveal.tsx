"use client";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <LazyMotion features={domAnimation}><m.div className={className}
    initial={false} whileInView={reduced ? {} : { opacity: [0.7, 1], y: [12, 0] }}
    viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.5, ease: "easeOut" }}>{children}</m.div></LazyMotion>;
}
