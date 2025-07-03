"use client";

import React from "react";
import { motion } from "framer-motion";

export const BeamsBackground = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-background" />
      <div className="absolute inset-0 z-10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]">
        <svg className="absolute inset-0 h-full w-full text-primary/10" aria-hidden="true">
          <defs>
            <pattern
              id="beams"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <path d="M.5 40V.5H40" fill="none" stroke="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" stroke="none" fill="url(#beams)" />
        </svg>
      </div>
      <motion.div
        className="absolute inset-0 z-20 bg-gradient-to-t from-background via-background to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-0 z-30 opacity-0 transition-opacity duration-500 group-hover/hero:opacity-100 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15),transparent_40%)]" />
    </div>
  );
};
