import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "FACULTY") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sessionId } = await params;

    const attendanceRecords = await prisma.attendance.findMany({
        where: { sessionId: parseInt(sessionId) },
        include: {
            student: { include: { user: true } },
            session: { include: { subject: true } }
        },
        orderBy: { timestamp: 'asc' }
    });

    if (attendanceRecords.length === 0) {
        return new NextResponse("No attendance records found.", { status: 404 });
    }

    const sessionData = attendanceRecords[0].session;
    const csvRows = [];

    // Header
    csvRows.push(["Roll Number", "Enrollment No", "Name", "Time", "Date", "Status"]);

    // Rows
    attendanceRecords.forEach(record => {
        csvRows.push([
            record.student.rollNumber,
            record.student.enrollmentNo,
            record.student.user.name,
            new Date(record.timestamp).toLocaleTimeString(),
            new Date(record.timestamp).toLocaleDateString(),
            "Present"
        ].map(field => `"${field}"`).join(",")); // Quote fields to handle commas
    });

    const csvContent = csvRows.join("\n");
    const filename = `${sessionData.subject.name}_${new Date(sessionData.startTime).toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}"`
        }
    });
}
