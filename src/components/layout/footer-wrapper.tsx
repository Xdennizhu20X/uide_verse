"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";

export function FooterWrapper() {
    const pathname = usePathname();
    const isLandingPage = pathname === "/";

    if (isLandingPage) return null;

    return <SiteFooter />;
}
