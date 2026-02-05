"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ExploreProjectsSection() {
    return (
        <section className="w-full h-screen flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
            <div className="container px-4 mx-auto text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-6xl font-bold text-[#0A1A3C] dark:text-white leading-tight mb-8"
                >
                    Explora los proyectos<br />
                    de los estudiantes de la <span className="text-[#F0A800]">UIDE</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-slate-500 dark:text-slate-300 max-w-2xl mx-auto mb-12"
                >
                    Descubre proyectos innovadores creados por nuestra comunidad universitaria.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Button asChild size="lg" className="h-16 px-12 rounded-full bg-[#0A1A3C] dark:bg-[#F0A800] hover:bg-[#152a58] dark:hover:bg-[#d99700] text-white dark:text-[#0A1A3C] text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                        <Link href="/projects">
                            Ver Proyectos <ArrowRight className="ml-2 w-6 h-6" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
