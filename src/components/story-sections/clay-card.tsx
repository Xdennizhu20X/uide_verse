"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface ClayCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    variant?: "white" | "primary" | "secondary" | "accent";
}

export function ClayCard({ children, className, variant = "white", ...props }: ClayCardProps) {
    const variants = {
        white: "bg-[#F8FAFC] text-slate-800 shadow-[inset_8px_8px_16px_rgba(0,0,0,0.05),inset_-8px_-8px_16px_rgba(255,255,255,1),10px_10px_20px_rgba(0,0,0,0.05)]",
        primary: "bg-[#0A1A3C] text-white shadow-[inset_8px_8px_16px_rgba(255,255,255,0.1),inset_-8px_-8px_16px_rgba(0,0,0,0.3),10px_10px_20px_rgba(10,26,60,0.2)]",
        secondary: "bg-[#910048] text-white shadow-[inset_6px_6px_12px_rgba(255,255,255,0.2),inset_-6px_-6px_12px_rgba(0,0,0,0.3),8px_8px_16px_rgba(145,0,72,0.2)]",
        accent: "bg-[#F0A800] text-slate-900 shadow-[inset_6px_6px_12px_rgba(255,255,255,0.3),inset_-6px_-6px_12px_rgba(0,0,0,0.2),8px_8px_16px_rgba(240,168,0,0.2)]",
    };

    return (
        <motion.div
            className={cn(
                "rounded-[2rem] p-6 relative overflow-hidden transition-all duration-300",
                variants[variant],
                className
            )}
            {...props}
        >
            {/* Glossy reflection for extra 3D feel */}
            <div className="absolute top-4 left-4 w-1/2 h-1/2 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
