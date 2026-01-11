import { prisma } from "@/lib/prisma";
import AddFacultyForm from "./AddFacultyForm";
import UserList from "@/components/UserList";

export default async function FacultyPage() {
    const facultyList = await prisma.faculty.findMany({
        include: { user: true },
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold dark:text-white">Faculty Management</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Section */}
                <div className="lg:col-span-2">
                    <UserList type="faculty" users={facultyList} />
                </div>

                {/* Add Form Section */}
                <AddFacultyForm />
            </div>
        </div>
    );
}
