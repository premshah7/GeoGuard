"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Polyfill for DOMMatrix and Promise.withResolvers if missing (from bulk-upload.ts)
if (typeof Promise.withResolvers === 'undefined') {
    // @ts-ignore
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}
if (typeof DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { };
}

const pdf = require("pdf-parse");

// --- User Management Actions ---

export async function createUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as Role;

    if (!name || !email || !password || !role) {
        return { error: "Missing required fields" };
    }

    const hashedPassword = await hashPassword(password);

    try {
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                },
            });

            if (role === "FACULTY") {
                await tx.faculty.create({
                    data: {
                        userId: user.id,
                    },
                });
            } else if (role === "STUDENT") {
                const rollNumber = formData.get("rollNumber") as string;
                const enrollmentNo = formData.get("enrollmentNo") as string;

                if (!rollNumber || !enrollmentNo) {
                    throw new Error("Missing Student fields");
                }

                await tx.student.create({
                    data: {
                        userId: user.id,
                        rollNumber,
                        enrollmentNo,
                    },
                });
            }
        });

        revalidatePath("/admin/faculty");
        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Create User Error:", error);
        return { error: "Failed to create user. Email or unique fields might be taken." };
    }
}

export async function deleteUser(userId: number) {
    try {
        await prisma.user.delete({
            where: { id: userId },
        });
        revalidatePath("/admin/faculty");
        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete user" };
    }
}

export async function resetDevice(studentId: number) {
    try {
        await prisma.student.update({
            where: { id: studentId },
            data: { deviceHash: null }
        });
        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Reset Device Error:", error);
        return { error: "Failed to reset device" };
    }
}

export async function bulkDeleteUsers(userIds: number[]) {
    try {
        await prisma.user.deleteMany({
            where: { id: { in: userIds } },
        });
        revalidatePath("/admin/faculty");
        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Bulk Delete Error:", error);
        return { error: "Failed to delete users" };
    }
}

// --- Bulk Upload Actions ---

export async function parsePdfAction(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) return { error: "No file provided" };

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdf(buffer);
        return { text: data.text };
    } catch (error) {
        console.error("PDF Parse Error:", error);
        return { error: "Failed to parse PDF" };
    }
}

export type BulkStudentData = {
    rollNumber: string;
    enrollmentNo: string;
    name: string;
    email: string;
};

export async function bulkCreateStudents(students: BulkStudentData[]) {
    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
    };

    console.log(`Starting optimized bulk upload for ${students.length} students...`);

    // 1. Generate hash once for performance (approx 50x speedup)
    const hashedPassword = await bcrypt.hash("geoguard123", 10);

    // 2. Process in batches to manage DB connection pool
    const BATCH_SIZE = 20;
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
        const batch = students.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (student) => {
            try {
                // Check if exists (Parallel read)
                const existingStudent = await prisma.student.findFirst({
                    where: {
                        OR: [
                            { rollNumber: student.rollNumber },
                            { enrollmentNo: student.enrollmentNo },
                        ]
                    }
                });

                if (existingStudent) {
                    results.failed++;
                    results.errors.push(`Skipped ${student.rollNumber}: Already exists.`);
                    return;
                }

                const existingUser = await prisma.user.findUnique({
                    where: { email: student.email }
                });

                if (existingUser) {
                    results.failed++;
                    results.errors.push(`Skipped ${student.email}: Email taken.`);
                    return;
                }

                // Create User & Student (Transaction)
                await prisma.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: {
                            name: student.name,
                            email: student.email,
                            password: hashedPassword,
                            role: "STUDENT",
                        }
                    });

                    await tx.student.create({
                        data: {
                            userId: newUser.id,
                            rollNumber: student.rollNumber,
                            enrollmentNo: student.enrollmentNo,
                        }
                    });
                });

                results.success++;
            } catch (error) {
                console.error(`Error creating student ${student.rollNumber}:`, error);
                results.failed++;
                // @ts-ignore
                results.errors.push(`Error for ${student.rollNumber}: ${error.message || "DB Error"}`);
            }
        }));
    }

    return results;
}
