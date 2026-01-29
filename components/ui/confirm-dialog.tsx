"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    loading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    loading = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case "danger":
                return {
                    iconBg: "bg-red-500/20",
                    iconColor: "text-red-400",
                    buttonBg: "bg-red-600 hover:bg-red-500",
                };
            case "warning":
                return {
                    iconBg: "bg-yellow-500/20",
                    iconColor: "text-yellow-400",
                    buttonBg: "bg-yellow-600 hover:bg-yellow-500",
                };
            case "success":
                return {
                    iconBg: "bg-green-500/20",
                    iconColor: "text-green-400",
                    buttonBg: "bg-green-600 hover:bg-green-500",
                };
            default:
                return {
                    iconBg: "bg-blue-500/20",
                    iconColor: "text-blue-400",
                    buttonBg: "bg-blue-600 hover:bg-blue-500",
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all scale-100 opacity-100"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${styles.iconBg} ${styles.iconColor}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2 ${styles.buttonBg}`}
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
