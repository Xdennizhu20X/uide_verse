"use client";

import { motion } from "framer-motion";
import { ClayCard } from "./clay-card";

export function ValuePropSection() {
    return (
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
            <div className="container px-4 mx-auto relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0A1A3C] dark:text-white leading-tight mb-12"
                    >
                        Muestra tus proyectos,<br />
                        <span className="text-[#F0A800]">colabora con compañeros</span><br />
                        y construye un legado.
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-500 dark:text-slate-300 font-light max-w-3xl mx-auto"
                    >
                        Una plataforma diseñada para que el talento universitario no se quede en el aula.
                    </motion.p>
                </div>
            </div>

            {/* Decorative Side Elements */}
            <motion.div
                initial={{ x: -200, opacity: 0 }}
                whileInView={{ x: 0, opacity: 0.3 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="absolute top-1/3 left-[-5%] w-64 h-64 md:w-96 md:h-96 pointer-events-none"
            >
                <ClayCard variant="white" className="w-full h-full rounded-full"><></></ClayCard>
            </motion.div>

            <motion.div
                initial={{ x: 200, opacity: 0 }}
                whileInView={{ x: 0, opacity: 0.3 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="absolute bottom-1/3 right-[-5%] w-48 h-48 md:w-80 md:h-80 pointer-events-none"
            >
                <ClayCard variant="accent" className="w-full h-full rounded-[3rem]"><></></ClayCard>
            </motion.div>
        </section>
    );
}
