"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowDown, Atom, BookOpen, Lightbulb, Rocket } from "lucide-react";
import { ClayCard } from "./clay-card";
import { useRef } from "react";

export function HeroSection() {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    // Parallax effects for scroll
    const yText = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const yIcon1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const yIcon2 = useTransform(scrollYProgress, [0, 1], [0, -300]);
    const yIcon3 = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section ref={containerRef} className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
            {/* Floating Background Elements (Clay) */}
            <motion.div
                style={{ y: yIcon1 }}
                initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: -12 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute top-[15%] left-[10%] z-10 w-24 h-24 md:w-32 md:h-32"
            >
                <ClayCard variant="accent" className="w-full h-full flex items-center justify-center rounded-[2rem]">
                    <Lightbulb className="w-10 h-10 md:w-14 md:h-14 text-white" />
                </ClayCard>
            </motion.div>

            <motion.div
                style={{ y: yIcon2 }}
                initial={{ opacity: 0, scale: 0.5, rotate: 30 }}
                animate={{ opacity: 1, scale: 1, rotate: 6 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="absolute bottom-[25%] right-[8%] z-10 w-28 h-28 md:w-40 md:h-40"
            >
                <ClayCard variant="secondary" className="w-full h-full flex items-center justify-center rounded-[2.5rem]">
                    <Rocket className="w-12 h-12 md:w-16 md:h-16 text-white" />
                </ClayCard>
            </motion.div>

            <motion.div
                style={{ y: yIcon3 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.8, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="absolute top-[20%] right-[15%] z-0 w-20 h-20"
            >
                <ClayCard variant="white" className="w-full h-full flex items-center justify-center rounded-[1.5rem] rotate-[15deg]">
                    <Atom className="w-8 h-8 text-[#0A1A3C]" />
                </ClayCard>
            </motion.div>

            <motion.div
                style={{ y: yIcon1 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.8, scale: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="absolute bottom-[20%] left-[15%] z-0 w-20 h-20"
            >
                <ClayCard variant="primary" className="w-full h-full flex items-center justify-center rounded-[1.5rem] rotate-[-5deg]">
                    <BookOpen className="w-8 h-8 text-white" />
                </ClayCard>
            </motion.div>

            {/* Main Content */}
            <motion.div
                style={{ y: yText, opacity: opacityHero }}
                className="relative z-20 container px-4 text-center mx-auto"
            >
                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-8 inline-block"
                >
                    <span className="px-6 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md shadow-sm border border-slate-200 dark:border-white/20 text-sm font-bold tracking-widest text-slate-500 dark:text-slate-300 uppercase">
                        Plataforma Universitaria
                    </span>
                </motion.div>

                <motion.h1
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#0A1A3C] dark:text-white leading-[1.1] mb-6"
                >
                    Descubre la<br />
                    <span className="text-[#910048] dark:text-[#F0A800]">próxima generación</span><br />
                    de innovación.
                </motion.h1>

                <motion.p
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
                >
                    Un espacio donde las ideas académicas cobran vida y el talento se transforma en impacto.
                </motion.p>

                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="flex justify-center gap-4"
                >
                    <Button asChild size="lg" className="h-16 px-12 rounded-full bg-[#0A1A3C] dark:bg-[#F0A800] hover:bg-[#152a58] dark:hover:bg-[#d99700] text-white dark:text-[#0A1A3C] text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                        <Link href="/register">Empezar Ahora</Link>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                style={{ opacity: opacityHero }}
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-400 dark:text-slate-500"
            >
                <ArrowDown className="w-8 h-8" />
            </motion.div>
        </section>
    );
}
