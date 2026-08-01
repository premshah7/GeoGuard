import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Code2, Github, Linkedin, Mail, ExternalLink, Cpu } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

export default async function DeveloperPage() {
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

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-16">

                {/* Hero */}
                <div className="max-w-4xl space-y-6 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                        <Cpu className="w-4 h-4" />
                        Engineered for Excellence
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
                        Built with <br />
                        <span className="text-primary">Passion & Precision.</span>
                    </h1>
                </div>

                {/* Developer Bio Card */}
                <div className="max-w-2xl w-full mx-auto">
                    <div className="bg-card border border-border p-10 rounded-xl flex flex-col md:flex-row items-center gap-8 text-left shadow-sm hover:shadow-md transition-all">

                        {/* Avatar Placeholder */}
                        <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-4xl">👨‍💻</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Full Stack Developer</h2>
                                <p className="text-muted-foreground font-medium">Prem Shah</p>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Passionate about solving real-world problems through clean, efficient code. ScanX was built to address the integrity gap in academic attendance systems using modern web technologies.
                            </p>

                            {/* Social Links */}
                            <div className="flex gap-4 pt-2">
                                <SocialLink href="https://github.com/premshah7" icon={Github} label="GitHub" />
                                <SocialLink href="https://www.linkedin.com/in/prem-shah77" icon={Linkedin} label="LinkedIn" />
                                <SocialLink href="mailto:contact@premshah.dev" icon={Mail} label="Email" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tech Stack Mini Grid */}
                <div className="max-w-3xl mx-auto w-full">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Tech Stack</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {["Next.js 15", "TypeScript", "Prisma", "PostgreSQL", "TailwindCSS", "FingerprintJS", "NextAuth"].map((tech) => (
                            <span key={tech} className="px-4 py-2 rounded-lg bg-muted border border-border text-sm font-medium text-foreground">
                                {tech}
                            </span>
                        ))}
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

function SocialLink({ href, icon: Icon, label }: any) {
    return (
        <Link
            href={href}
            target="_blank"
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={label}
        >
            <Icon className="w-5 h-5" />
        </Link>
    )
}
