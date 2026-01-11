"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSubject(formData: FormData) {
    const name = formData.get("name") as string;
    const facultyId = formData.get("facultyId") as string;

    if (!name || !facultyId) {
        return { error: "Missing required fields" };
    }

    try {
        await prisma.subject.create({
            data: {
                name,
                facultyId: parseInt(facultyId),
            },
        });

        revalidatePath("/admin/subjects");
        return { success: true };
    } catch (error) {
        console.error("Create Subject Error:", error);
        return { error: "Failed to create subject." };
    }
}

export async function deleteSubject(subjectId: number) {
    try {
        await prisma.subject.delete({
            where: { id: subjectId },
        });
        revalidatePath("/admin/subjects");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete subject" };
    }
}
