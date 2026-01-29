"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parsePdfToTable } from "@/lib/pdf";

type StudentData = {
    name: string;
    email: string;
    roll?: string;
    enrollment?: string;
    batch?: string;
};

// 1. Preview PDF Data (For Flexible Modal)
export async function parsePdfPreview(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) return { error: "No file provided" };

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const rows = await parsePdfToTable(buffer);

        if (rows.length === 0) return { error: "Could not extract text from PDF" };

        // Heuristics: Find the header row (row with "Name", "Email" etc)
        // If not found, default to first row
        let headerIndex = 0;
        const potentialHeaderIdx = rows.findIndex(r =>
            r.some(c => /name/i.test(c) || /email/i.test(c))
        );

        if (potentialHeaderIdx !== -1) headerIndex = potentialHeaderIdx;

        const headers = rows[headerIndex];
        const dataRows = rows.slice(headerIndex + 1);

        return { success: true, headers, rows: dataRows };

    } catch (error: any) {
        console.error("PDF Preview Error:", error);
        return { error: "Failed to parse PDF: " + error.message };
    }
}

// 2. Upload Normalized Data (For Flexible Modal)
export async function uploadBulkUsers(students: StudentData[], role: "STUDENT" | "FACULTY" = "STUDENT") {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    if (!students || students.length === 0) {
        return { error: "No student data provided" };
    }

    try {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        const salt = await bcrypt.genSalt(10);
        const defaultHash = await bcrypt.hash("password123", salt);

        // A. Resolve Batches
        const batchMap = new Map<string, number>();
        const batchNames = [...new Set(students.map(u => u.batch).filter(Boolean))];

        if (batchNames.length > 0) {
            const existingBatches = await prisma.batch.findMany({
                where: { name: { in: batchNames as string[] } }
            });
            existingBatches.forEach(b => batchMap.set(b.name, b.id));
        }

        // B. Filter Existing Users (Email, Roll, Enrollment)
        const emails = students.map(u => u.email).filter(Boolean);
        const rolls = students.map(u => u.roll).filter(Boolean);
        const enrollments = students.map(u => u.enrollment).filter(Boolean);

        const [existingUsers, existingStudents] = await Promise.all([
            prisma.user.findMany({
                where: { email: { in: emails } },
                select: { email: true }
            }),
            prisma.student.findMany({
                where: {
                    OR: [
                        { rollNumber: { in: rolls as string[] } },
                        { enrollmentNo: { in: enrollments as string[] } }
                    ]
                },
                select: { rollNumber: true, enrollmentNo: true }
            })
        ]);

        const existingEmailSet = new Set(existingUsers.map(u => u.email));
        const existingRollSet = new Set(existingStudents.map(s => s.rollNumber));
        const existingEnrollSet = new Set(existingStudents.map(s => s.enrollmentNo));

        const newUsers = students.filter(u => {
            if (existingEmailSet.has(u.email)) return false;
            // Only check roll/enrollment if they are provided
            if (u.roll && existingRollSet.has(u.roll)) return false;
            if (u.enrollment && existingEnrollSet.has(u.enrollment)) return false;
            return true;
        });

        // Report Errors for Skipped
        students.forEach(s => {
            if (existingEmailSet.has(s.email)) results.errors.push(`Skipped existing Email: ${s.email}`);
            else if (s.roll && existingRollSet.has(s.roll)) results.errors.push(`Skipped existing Roll No: ${s.roll} (${s.email})`);
            else if (s.enrollment && existingEnrollSet.has(s.enrollment)) results.errors.push(`Skipped existing Enrollment: ${s.enrollment} (${s.email})`);
        });

        results.failed += (students.length - newUsers.length);

        if (newUsers.length === 0) {
            return { success: true, stats: results };
        }

        // C. Transactional Create
        await prisma.$transaction(async (tx) => {
            // 1. Create Users
            await tx.user.createMany({
                data: newUsers.map(u => ({
                    name: u.name || "Unknown",
                    email: u.email,
                    password: defaultHash,
                    role: role,
                    status: "APPROVED"
                })),
                skipDuplicates: true
            });

            // 2. Fetch created IDs
            const createdUsers = await tx.user.findMany({
                where: { email: { in: newUsers.map(u => u.email) } },
                select: { id: true, email: true }
            });

            // 3. Create Profiles
            if (role === "STUDENT") {
                const studentData = createdUsers.map(u => {
                    const original = newUsers.find(nu => nu.email === u.email);
                    if (!original) return null;

                    const batchId = original.batch ? (batchMap.get(original.batch) || null) : null;

                    return {
                        userId: u.id,
                        rollNumber: original.roll || "",
                        enrollmentNo: original.enrollment || "",
                        batchId: batchId
                    };
                }).filter(Boolean);

                if (studentData.length > 0) {
                    await tx.student.createMany({
                        data: studentData as any,
                        skipDuplicates: true
                    });
                }
            } else if (role === "FACULTY") {
                const facultyData = createdUsers.map(u => ({
                    userId: u.id
                }));

                if (facultyData.length > 0) {
                    await tx.faculty.createMany({
                        data: facultyData,
                        skipDuplicates: true
                    });
                }
            }

            results.success += createdUsers.length;
        });

        revalidatePath("/admin/students");
        return { success: true, stats: results };

    } catch (error: any) {
        console.error("Bulk Upload Error:", error);
        return { error: error.message || "Upload failed" };
    }
}
