"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedWrapper({
  children,
  className,
  delay = 0,
}: AnimatedWrapperProps) {
  const variants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: delay / 1000,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
