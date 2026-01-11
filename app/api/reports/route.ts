import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "FACULTY" && session.user.role !== "ADMIN")) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const subjectId = searchParams.get("subjectId");

    // Build filter
    const whereClause: any = {};

    if (startDate && endDate) {
        whereClause.timestamp = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    if (subjectId) {
        whereClause.session = {
            subjectId: parseInt(subjectId)
        };
    } else if (session.user.role === "FACULTY") {
        // Limit faculty to their own subjects if no specific subject selected (or strictly enforce ownership)
        // For simplicity, let's enforce that the session must belong to a subject owned by this faculty
        const faculty = await prisma.faculty.findUnique({ where: { userId: parseInt(session.user.id) } });
        if (faculty) {
            whereClause.session = {
                ...whereClause.session,
                subject: {
                    facultyId: faculty.id
                }
            };
        }
    }

    try {
        const data = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                student: { include: { user: true } },
                session: { include: { subject: true } }
            },
            orderBy: { timestamp: 'desc' }
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Report API Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
