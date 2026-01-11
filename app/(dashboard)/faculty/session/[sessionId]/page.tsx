import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import SessionScreen from "../active-session";
import { endSession } from "../../actions";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "FACULTY") redirect("/api/auth/signin");

    const { sessionId } = await params;
    const id = parseInt(sessionId);

    const activeSession = await prisma.session.findUnique({
        where: { id },
        include: { subject: true }
    });

    if (!activeSession) notFound();
    // Removed redirect for inactive sessions to allow history viewing

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">{activeSession.subject.name}</h1>
                    {activeSession.isActive ? (
                        <span className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live Session
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                            Session Ended
                        </span>
                    )}
                </div>

                {activeSession.isActive && (
                    <form action={async () => {
                        "use server";
                        await endSession(id);
                    }}>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            End Session
                        </button>
                    </form>
                )}
            </div>

            <div className="flex-1">
                <SessionScreen sessionId={id} isActive={activeSession.isActive} />
            </div>
        </div>
    );
}
