"use client";

import { createUser } from "@/actions/admin";
import { useRef } from "react";

export default function AddStudentForm() {
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (formData: FormData) => {
        const result = await createUser(formData);
        if (result.error) {
            alert(result.error);
        } else {
            alert("Student created successfully!");
            formRef.current?.reset();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 h-fit">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200">Add New Student</h2>
            </div>
            <div className="p-6">
                <form ref={formRef} action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="role" value="STUDENT" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input required type="text" name="name" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="Jane Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input required type="email" name="email" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="jane@student.edu" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input required type="password" name="password" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="******" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roll Number</label>
                            <input required type="text" name="rollNumber" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="CS-24-001" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enrollment No</label>
                            <input required type="text" name="enrollmentNo" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="ENR123456" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                        Create Student Account
                    </button>
                </form>
            </div>
        </div>
    );
}
