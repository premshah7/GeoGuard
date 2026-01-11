"use client";

import { createSubject } from "./actions";
import { useRef } from "react";

type SimpleUser = {
    name: string;
};

type FacultyWithUser = {
    id: number;
    user: SimpleUser;
};

export default function AddSubjectForm({ facultyList }: { facultyList: FacultyWithUser[] }) {
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (formData: FormData) => {
        const result = await createSubject(formData);
        if (result.error) {
            alert(result.error);
        } else {
            alert("Subject created successfully!");
            formRef.current?.reset();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 h-fit">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200">Add New Subject</h2>
            </div>
            <div className="p-6">
                <form ref={formRef} action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name</label>
                        <input required type="text" name="name" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="Database Management Systems" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Faculty</label>
                        <select required name="facultyId" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white">
                            <option value="">Select Faculty...</option>
                            {facultyList.map((faculty) => (
                                <option key={faculty.id} value={faculty.id}>
                                    {faculty.user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                        Create Subject
                    </button>
                </form>
            </div>
        </div>
    );
}
