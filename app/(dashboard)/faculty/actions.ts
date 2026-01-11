"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createSession(subjectId: number, _formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "FACULTY") {
        throw new Error("Unauthorized");
    }

    // Verify subject belongs to faculty
    const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: { faculty: true }
    });

    if (!subject || subject.faculty.userId !== parseInt(session.user.id)) {
        throw new Error("You are not authorized to start a session for this subject.");
    }

    // Create active session
    const newSession = await prisma.session.create({
        data: {
            subjectId,
            isActive: true,
            startTime: new Date(),
        }
    });

    redirect(`/faculty/session/${newSession.id}`);
}

export async function endSession(sessionId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "FACULTY") return;

    await prisma.session.update({
        where: { id: sessionId },
        data: {
            isActive: false,
            endTime: new Date()
        }
    });

    redirect("/faculty");
}
