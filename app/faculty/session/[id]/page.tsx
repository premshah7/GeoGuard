import { prisma } from "@/lib/prisma";
import SessionView from "@/components/faculty/SessionView";
import { notFound, redirect } from "next/navigation";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) notFound();

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { subject: true },
    });

    if (!session) notFound();

    if (!session.isActive) {
        redirect("/faculty");
    }

    return (
        <div className="min-h-screen bg-gray-950 p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-red-400 font-bold tracking-wider text-sm uppercase">Live Session</span>
            </div>

            <SessionView
                sessionId={session.id}
                subjectName={session.subject.name}
                subjectId={session.subjectId}
            />
        </div>
    );
}
