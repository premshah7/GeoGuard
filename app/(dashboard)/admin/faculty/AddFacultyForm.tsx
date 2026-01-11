"use client";

import { createUser } from "@/actions/admin";
import { useRef } from "react";

export default function AddFacultyForm() {
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (formData: FormData) => {
        const result = await createUser(formData);
        if (result.error) {
            alert(result.error);
        } else {
            alert("Faculty created successfully!");
            formRef.current?.reset();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 h-fit">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200">Add New Faculty</h2>
            </div>
            <div className="p-6">
                <form ref={formRef} action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="role" value="FACULTY" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input required type="text" name="name" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="Dr. John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input required type="email" name="email" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="john@university.edu" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input required type="password" name="password" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="******" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                        Create Faculty Account
                    </button>
                </form>
            </div>
        </div>
    );
}
