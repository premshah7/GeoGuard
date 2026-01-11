import { NextRequest, NextResponse } from "next/server";
import { generateQrToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "FACULTY") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const id = parseInt(sessionId);

    // Validate session exists and is active
    const activeSession = await prisma.session.findUnique({
        where: { id },
    });

    if (!activeSession || !activeSession.isActive) {
        return NextResponse.json({ error: "Session invalid or ended" }, { status: 404 });
    }

    // Generate new token
    const token = generateQrToken(id);

    return NextResponse.json({ token });
}
