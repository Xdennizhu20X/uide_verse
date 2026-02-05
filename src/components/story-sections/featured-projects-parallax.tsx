"use client";

import { motion } from "framer-motion";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { ClayCard } from "./clay-card";

interface FeaturedProjectsParallaxProps {
    projects: Project[];
}

export function FeaturedProjectsParallax({ projects }: FeaturedProjectsParallaxProps) {
    return (
        <section className="w-full h-screen snap-start flex items-center justify-center overflow-hidden">
            <div className="container px-4 mx-auto max-h-screen flex flex-col justify-center">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-[#0A1A3C] tracking-tight leading-none mb-4">
                            Proyectos<br />Destacados
                        </h2>
                        <p className="text-xl md:text-2xl text-slate-500 max-w-xl">
                            Innovación e inspiración de nuestra comunidad.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Button asChild size="lg" className="rounded-full h-16 px-10 bg-[#0A1A3C] text-white text-lg hover:bg-[#152a58] transition-all shadow-xl hover:scale-105">
                            <Link href="/projects">Ver Todo <ArrowRight className="ml-2 w-6 h-6" /></Link>
                        </Button>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 100 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className={`${index === 2 ? 'hidden lg:block' : ''}`}
                        >
                            <div className="group relative transition-all duration-300 hover:-translate-y-2">
                                <ClayCard className="p-0 overflow-hidden bg-white shadow-xl hover:shadow-2xl h-full">
                                    <div className="p-2 h-full">
                                        <ProjectCard project={project} />
                                    </div>
                                </ClayCard>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
