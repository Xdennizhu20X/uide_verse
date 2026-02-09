"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { motion } from "framer-motion";

export function NavbarWrapper() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-50 transition-all duration-300"
        >
            <SiteHeader />
        </motion.div>
    );
}
