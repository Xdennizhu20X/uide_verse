"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ExploreProjectsSection() {
    return (
        <section className="w-full h-screen flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
            <div className="container px-4 mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-6xl font-bold text-dark-navy dark:text-white leading-tight mb-8">
                        Explora los proyectos<br />
                        de los estudiantes de la <span className="text-amber-600 dark:text-[#F0A800]">UIDE</span>
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <p className="text-xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto mb-12">
                        Descubre proyectos innovadores creados por nuestra comunidad universitaria.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Button asChild size="lg" className="h-16 px-12 rounded-full bg-dark-navy dark:bg-accent-gold hover:bg-blue-900 dark:hover:bg-amber-400 text-white dark:text-dark-navy text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                        <Link href="/projects">
                            Ver Proyectos <ArrowRight className="ml-2 w-6 h-6" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
