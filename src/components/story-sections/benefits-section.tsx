"use client";

import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Leaf, Users } from "lucide-react";

const benefits = [
    {
        title: "Muestra tu Talento",
        desc: "Gana visibilidad. Deja que empresas y docentes vean de lo que eres capaz.",
        icon: BrainCircuit,
        iconBg: "bg-[#0A1A3C] dark:bg-[#F0A800]"
    },
    {
        title: "Colabora e Innova",
        desc: "Encuentra compañeros apasionados y lleva tus ideas al siguiente nivel.",
        icon: Users,
        iconBg: "bg-[#F0A800]"
    },
    {
        title: "Genera Impacto",
        desc: "Participa en desafíos reales y contribuye a un mundo mejor.",
        icon: Leaf,
        iconBg: "bg-[#910048]"
    }
];

export function BenefitsSection() {
    return (
        <section className="w-full h-screen flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
            <div className="container px-4 mx-auto max-h-screen flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8 }}
                    className="mb-12 md:mb-16 relative"
                >
                    <h2 className="text-6xl md:text-8xl font-black text-[#0A1A3C]/10 dark:text-white/10 tracking-tighter absolute -z-10 select-none">
                        BENEFICIOS
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-[#0A1A3C] dark:text-white pt-8 md:pt-12 ml-4">
                        ¿POR QUÉ UNIRTE?
                    </h3>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-10">
                    {benefits.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 80 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            className="h-full"
                        >
                            <div className="h-full flex flex-col justify-between bg-white dark:bg-[#152a58] rounded-3xl p-6 shadow-xl dark:shadow-2xl border border-slate-100 dark:border-[#1e3a6d] hover:scale-[1.03] hover:shadow-2xl transition-all duration-300">
                                <div>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white dark:text-[#0A1A3C] shadow-lg ${item.iconBg}`}>
                                        <item.icon className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-2xl md:text-3xl font-bold text-[#0A1A3C] dark:text-white mb-4">{item.title}</h4>
                                    <p className="text-slate-500 dark:text-slate-300 text-lg leading-relaxed mb-4">{item.desc}</p>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <ArrowRight className="text-slate-300 dark:text-[#F0A800] w-8 h-8" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
