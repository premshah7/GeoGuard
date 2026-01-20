"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBatches() {
    try {
        const batches = await prisma.batch.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { students: true }
                }
            }
        });
        return { batches };
    } catch (error) {
        console.error("Error fetching batches:", error);
        return { error: "Failed to fetch batches" };
    }
}

export async function createBatch(name: string) {
    if (!name) return { error: "Batch name is required" };

    try {
        await prisma.batch.create({
            data: { name }
        });
        revalidatePath("/admin/settings");
        revalidatePath("/admin/faculty");
        revalidatePath("/admin/students");
        revalidatePath("/admin/batches");
        return { success: true };
    } catch (error) {
        console.error("Error creating batch:", error);
        return { error: "Failed to create batch. Name might be duplicate." };
    }
}

export async function deleteBatch(id: number) {
    try {
        await prisma.batch.delete({
            where: { id }
        });
        revalidatePath("/admin/settings");
        revalidatePath("/admin/faculty");
        revalidatePath("/admin/students");
        revalidatePath("/admin/batches");
        return { success: true };
    } catch (error) {
        console.error("Error deleting batch:", error);
        return { error: "Failed to delete batch" };
    }
}

export async function getBatchDetails(id: number) {
    try {
        const batch = await prisma.batch.findUnique({
            where: { id },
            include: {
                students: {
                    include: {
                        user: true
                    }
                },
                _count: {
                    select: { students: true }
                }
            }
        });
        return { batch };
    } catch (error) {
        console.error("Error fetching batch details:", error);
        return { error: "Failed to fetch batch details" };
    }
}
