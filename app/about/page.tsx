import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck, Lock, Fingerprint, Globe, UserCheck, Info } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

export default async function AboutPage() {
    const headersList = await headers();
    const referer = headersList.get("referer");

    // Strict Access Control: Only allow access if coming from the landing page
    if (!referer || !referer.includes(process.env.NEXT_PUBLIC_APP_URL || "localhost")) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Navbar */}
            <Navbar />

            <main className="flex-1 flex flex-col items-center justify-start p-6 pt-12 md:pt-20 text-center space-y-20">

                {/* Hero */}
                <div className="max-w-4xl space-y-6 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                        <Info className="w-4 h-4" />
                        About The Project
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
                        Securing the Future of <br />
                        <span className="text-primary">Academic Integrity.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        ScanX isn't just an attendance system. It's a fortified digital ecosystem designed to eliminate proxies, ensure accurate records, and streamline the classroom experience.
                    </p>
                </div>

                {/* Mission Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto w-full items-center">
                    <div className="space-y-6 text-left">
                        <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Traditional attendance methods are flawed. Roll calls waste time, and simple sign-in sheets are easily manipulated. We built ScanX to solve this problem once and for all.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            By leveraging advanced browser fingerprinting, IP geolocation, and device-binding technology, we ensure that <strong>one student = one device</strong>. No more "marking for a friend."
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={UserCheck} label="Authentic Records" value="100%" />
                        <StatCard icon={Lock} label="Proxy Attempts Blocked" value="Zero" />
                        <StatCard icon={Globe} label="Geo-Fenced" value="Active" />
                        <StatCard icon={Fingerprint} label="Device Binding" value="Secure" />
                    </div>
                </div>

                {/* Tech Stack / How it Works */}
                <div className="w-full max-w-6xl mx-auto pb-20">
                    <h2 className="text-3xl font-bold text-foreground mb-10">Powered by Modern Tech</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TechCard
                            title="Device Fingerprinting"
                            description="We generate a unique hash based on the user's browser, screen resolution, and hardware components to identify devices uniquely."
                        />
                        <TechCard
                            title="Next.js & Server Actions"
                            description="Built on the latest Next.js 15 framework for blazing fast performance and secure server-side logic."
                        />
                        <TechCard
                            title="Prisma ORM"
                            description="Type-safe database interactions ensuring data integrity and reliable record keeping."
                        />
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card/50 py-8 text-center text-muted-foreground text-sm">
                <div className="max-w-7xl mx-auto">
                    <p>&copy; {new Date().getFullYear()} ScanX System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function StatCard({ icon: Icon, label, value }: any) {
    return (
        <div className="p-6 rounded-xl bg-card border border-border text-center hover:shadow-md transition-all">
            <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
        </div>
    )
}

function TechCard({ title, description }: any) {
    return (
        <div className="p-8 rounded-xl bg-card border border-border text-left hover:shadow-md transition-all">
            <h3 className="text-lg font-bold text-foreground mb-3">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
    )
}
