import { prisma } from "@/lib/prisma";
import AddFacultyForm from "@/components/admin/AddFacultyForm";
import { User } from "lucide-react";

export default async function FacultyManagementPage() {
    const facultyList = await prisma.faculty.findMany({
        include: {
            user: true,
            subjects: true,
        },
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Faculty Management</h1>
                <AddFacultyForm />
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-800 text-gray-400">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Subjects</th>
                            <th className="p-4">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {facultyList.map((faculty) => (
                            <tr key={faculty.id} className="hover:bg-gray-800/50">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <span className="font-medium">{faculty.user.name}</span>
                                </td>
                                <td className="p-4 text-gray-400">{faculty.user.email}</td>
                                <td className="p-4">
                                    {faculty.subjects.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {faculty.subjects.map((sub) => (
                                                <span
                                                    key={sub.id}
                                                    className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded"
                                                >
                                                    {sub.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-sm">None assigned</span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-500">
                                    {new Date(faculty.user.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {facultyList.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No faculty members found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
