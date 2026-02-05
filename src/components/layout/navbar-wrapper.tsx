"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { motion, AnimatePresence } from "framer-motion";

export function NavbarWrapper() {
    const pathname = usePathname();
    const isLandingPage = pathname === "/";

    return (
        <AnimatePresence>
            {!isLandingPage && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative z-50 transition-all duration-300"
                >
                    <SiteHeader />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
