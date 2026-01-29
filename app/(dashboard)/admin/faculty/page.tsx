
import { prisma } from "@/lib/prisma";
import AddFacultyForm from "@/components/admin/AddFacultyForm";
import FacultyTable from "@/components/admin/FacultyTable";
import FlexibleUploadModal from "@/components/admin/FlexibleUploadModal";

import { getBatches } from "@/actions/batch";

export default async function FacultyManagementPage() {
    try {
        console.log("Fetching faculty list...");
        const [facultyList, batchesRes] = await Promise.all([
            prisma.faculty.findMany({
                include: {
                    user: true,
                    subjects: true,
                    batches: true, // Include batches
                },
                orderBy: {
                    id: 'desc'
                }
            }),
            getBatches()
        ]);

        const batches = batchesRes.batches || [];

        console.log("Faculty list fetched. Items:", facultyList.length);

        const serializedFaculty = facultyList.map((f) => ({
            ...f,
            user: {
                ...f.user,
                createdAt: f.user.createdAt.toISOString(),
            },
        }));

        console.log("Faculty list serialized.");

        return (
            <div>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold whitespace-nowrap text-foreground">Faculty Management</h1>
                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <FlexibleUploadModal userType="FACULTY" />
                        <AddFacultyForm batches={batches} />
                    </div>
                </div>

                <FacultyTable initialFaculty={serializedFaculty} batches={batches} />
            </div>
        );
    } catch (error: any) {
        console.error("Error loading faculty page:", error);
        return (
            <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl">
                <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Page</h2>
                <p className="text-red-500 mb-4">{error?.message || "An unexpected error occurred."}</p>
                <div className="text-left bg-gray-100 p-4 rounded text-xs font-mono overflow-auto max-h-48 text-gray-800">
                    {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
                </div>
            </div>
        );
    }
}
