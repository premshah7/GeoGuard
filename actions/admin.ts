"use server";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createFaculty(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "All fields are required" };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: UserRole.FACULTY,
                },
            });

            await tx.faculty.create({
                data: {
                    userId: user.id,
                },
            });
        });

        revalidatePath("/admin/faculty");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating faculty:", error);
        if (error.code === "P2002") {
            return { error: "Email already exists" };
        }
        return { error: "Failed to create faculty" };
    }
}

export async function createStudent(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const rollNumber = formData.get("rollNumber") as string;
    const enrollmentNo = formData.get("enrollmentNo") as string;

    if (!name || !email || !password || !rollNumber || !enrollmentNo) {
        return { error: "All fields are required" };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: UserRole.STUDENT,
                },
            });

            await tx.student.create({
                data: {
                    userId: user.id,
                    rollNumber,
                    enrollmentNo,
                },
            });
        });

        revalidatePath("/admin/students");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating student:", error);
        if (error.code === "P2002") {
            return { error: "Email, Roll Number, or Enrollment No already exists" };
        }
        return { error: "Failed to create student" };
    }
}

export async function resetDevice(studentId: number) {
    try {
        await prisma.student.update({
            where: { id: studentId },
            data: {
                deviceHash: null,
                isDeviceResetRequested: false,
            },
        });
        revalidatePath("/admin/students");
        revalidatePath("/student");
        return { success: true };
    } catch (error) {
        console.error("Error resetting device:", error);
        return { error: "Failed to reset device" };
    }
}
