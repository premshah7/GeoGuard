"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail, KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import { sendOtp } from "@/actions/otp";
import { resetPassword } from "@/actions/auth";

type Step = "email" | "otp" | "done";

function ForgotPasswordForm() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const identifierParam = searchParams.get("identifier");
        const otpParam = searchParams.get("otp");
        const magicParam = searchParams.get("magic");

        if (identifierParam) {
            setEmail(identifierParam);
        }
        if (otpParam) {
            setOtp(otpParam);
        }
        if (identifierParam && otpParam && magicParam === "true") {
            setStep("otp");
        }
    }, [searchParams]);

    const handleSendOtp = () => {
        setError("");
        startTransition(async () => {
            const res = await sendOtp(email, "forgot-password");
            if (res.success) setStep("otp");
            else setError(res.message);
        });
    };

    const handleReset = () => {
        setError("");
        if (newPassword !== confirmPassword) return setError("Passwords do not match");
        if (newPassword.length < 6) return setError("Password must be at least 6 characters");
        startTransition(async () => {
            const res = await resetPassword(email, otp, newPassword);
            if (res.success) setStep("done");
            else setError(res.error || "Failed to reset password");
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-card p-8 rounded-2xl border border-border shadow-xl">
                
                {step !== "done" && (
                    <Link href="/auth/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                )}

                {/* Step: Email */}
                {step === "email" && (
                    <>
                        <div className="text-center mb-6">
                            <div className="mx-auto w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-sm">
                                <Mail className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <h1 className="text-2xl font-bold mb-1">Forgot Password</h1>
                            <p className="text-muted-foreground text-sm">Enter your email to receive a verification code</p>
                        </div>
                        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}
                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                            <button
                                onClick={handleSendOtp}
                                disabled={!email || isPending}
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                            </button>
                        </div>
                    </>
                )}

                {/* Step: OTP + New Password */}
                {step === "otp" && (
                    <>
                        <div className="text-center mb-6">
                            <div className="mx-auto w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-sm">
                                <KeyRound className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
                            <p className="text-muted-foreground text-sm">Enter the code sent to <span className="font-semibold text-foreground">{email}</span></p>
                        </div>
                        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}
                        <div className="space-y-4">
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="6-digit code"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-2xl text-center tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                            <button
                                onClick={handleReset}
                                disabled={otp.length !== 6 || !newPassword || !confirmPassword || isPending}
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                            </button>
                            <button onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground">
                                Wrong email? Go back
                            </button>
                        </div>
                    </>
                )}

                {/* Step: Done */}
                {step === "done" && (
                    <div className="text-center py-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
                        <p className="text-muted-foreground text-sm mb-6">Your password has been updated successfully.</p>
                        <Link href="/auth/login" className="inline-block bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all">
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
            <ForgotPasswordForm />
        </Suspense>
    );
}
