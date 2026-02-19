"use client";

import { SiteHeader } from "@/components/layout/site-header";


export function NavbarWrapper() {
    return (
        <div
            className="relative z-50 transition-all duration-300"
        >
            <SiteHeader />
        </div>
    );
}
