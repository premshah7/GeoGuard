import { prisma } from "@/lib/prisma";
import { deleteSubject } from "./actions";
import { Trash2 } from "lucide-react";
import AddSubjectForm from "./AddSubjectForm";

export default async function SubjectsPage() {
    const subjects = await prisma.subject.findMany({
        include: { faculty: { include: { user: true } } },
    });

    const facultyList = await prisma.faculty.findMany({
        include: { user: true },
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold dark:text-white">Subject Management</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Section */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-200">All Subjects</h2>
                    </div>
                    <div className="divide-y dark:divide-gray-700">
                        {subjects.map((subject) => (
                            <div key={subject.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{subject.name}</p>
                                    <p className="text-sm text-gray-500">
                                        Faculty: <span className="font-medium text-blue-600 dark:text-blue-400">{subject.faculty.user.name}</span>
                                    </p>
                                </div>
                                <form action={async () => {
                                    "use server";
                                    await deleteSubject(subject.id);
                                }}>
                                    <button className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <Trash2 size={18} />
                                    </button>
                                </form>
                            </div>
                        ))}
                        {subjects.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No subjects found.</div>
                        )}
                    </div>
                </div>

                {/* Add Form Section */}
                <AddSubjectForm facultyList={facultyList} />
            </div>
        </div>
    );
}
