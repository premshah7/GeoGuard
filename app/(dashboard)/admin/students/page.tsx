import { prisma } from "@/lib/prisma";
import AddStudentForm from "./AddStudentForm";
import BulkStudentUpload from "@/components/BulkStudentUpload";
import UserList from "@/components/UserList";

export default async function StudentsPage() {
    const studentList = await prisma.student.findMany({
        include: { user: true },
        orderBy: { id: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold dark:text-white">Student Management</h1>
                <BulkStudentUpload />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Section */}
                <div className="lg:col-span-2">
                    <UserList type="student" users={studentList} />
                </div>

                {/* Add Form Section */}
                <AddStudentForm />
            </div>
        </div>
    );
}


