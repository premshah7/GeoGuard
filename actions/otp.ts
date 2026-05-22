"use server";

import { generateOtp, verifyOtpCode } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getOtpEmailHtml } from "@/lib/email-templates";
import { z } from "zod";

const PhoneSchema = z.string().min(10).regex(/^\+?[0-9\s-]{10,}$/);
const EmailSchema = z.string().email();

/**
 * Sends an OTP to the provided identifier (Email, Phone, or Username).
 */
export async function sendOtp(identifier: string, type: "login" | "forgot-password" = "login") {
    try {
        if (!identifier) {
            return { success: false, message: "Identifier is required" };
        }

        let targetIdentifier = identifier;
        let isEmail = false;

        // 1. Determine Type
        let isPhone = PhoneSchema.safeParse(identifier).success;
        const isEmailInput = EmailSchema.safeParse(identifier).success;

        if (isEmailInput) {
            isEmail = true;
        } else if (!isPhone) {
            // Assume Username -> Lookup User
            const user = await prisma.user.findUnique({
                where: { username: identifier },
                select: { email: true, phoneNumber: true }
            });

            if (!user) {
                return { success: false, message: "User not found" };
            }

            // Prefer Email for Username login if available
            if (user.email && !user.email.includes("@event.scanx.local")) { // Avoid dummy guest emails
                targetIdentifier = user.email;
                isEmail = true;
            } else if (user.phoneNumber) {
                targetIdentifier = user.phoneNumber;
                isPhone = true; // explicitly set
            } else {
                return { success: false, message: "No contact method found for this user" };
            }
        }

        // 2. Enforce Domain Restriction
        const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
        if (isEmail && allowedDomain && !targetIdentifier.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
            return { success: false, message: `Email must be from @${allowedDomain}` };
        }

        // 3. User Existence Check
        // Only send OTP if the user exists in the database
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: targetIdentifier },
                    { phoneNumber: targetIdentifier }
                ]
            }
        });

        if (!existingUser) {
            // For security, generic messages are better, but user explicitly asked to "not send".
            // We return false so the UI shows an error.
            return { success: false, message: "User not found with this identifier" };
        }

        // 4. Generate OTP
        let code;
        try {
            code = await generateOtp(targetIdentifier);
        } catch (e: any) {
            return { success: false, message: e.message || "Rate limit exceeded" };
        }

        // ... inside sendOtp ...

        // 3. Send OTP
        if (isEmail) {
            console.log(`[DEV] Sending Email OTP to ${targetIdentifier}: ${code}`);

            // Construct Magic Link
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            // Encode params just in case
            const path = type === "forgot-password" ? "forgot-password" : "login";
            const magicLink = `${baseUrl}/auth/${path}?identifier=${encodeURIComponent(identifier)}&otp=${code}&magic=true`;

            const htmlContent = getOtpEmailHtml(code, magicLink);

            await sendEmail(
                targetIdentifier,
                "Your ScanX Verification Code",
                htmlContent
            );
            return { success: true, message: `OTP sent to ${targetIdentifier}` };
        } else {
            // Phone (Mock)
            console.log(`[DEV-OTP] 📱 Phone: ${targetIdentifier} -> Code: ${code}`);
            return { success: true, message: "OTP sent to your phone" };
        }

    } catch (error) {
        console.error("Error sending OTP:", error);
        return { success: false, message: "Failed to send OTP" };
    }
}

/**
 * Verifies the OTP code.
 */
export async function verifyOtp(identifier: string, code: string) {
    try {
        if (!identifier || !code) {
            return { success: false, message: "Identifier and Code are required" };
        }

        // If username was used originally, we need to resolve it AGAIN to the same identifier
        // Or the frontend passes the RESOLVED identifier? 
        // Better: Frontend should pass the input. We resolve it again.

        let targetIdentifier = identifier;

        const isPhone = PhoneSchema.safeParse(identifier).success;
        const isEmailInput = EmailSchema.safeParse(identifier).success;

        if (!isPhone && !isEmailInput) {
            // Resolve Username again
            const user = await prisma.user.findUnique({
                where: { username: identifier },
                select: { email: true, phoneNumber: true }
            });

            if (!user) return { success: false, message: "User not found" };

            if (user.email && !user.email.includes("@event.scanx.local")) {
                targetIdentifier = user.email;
            } else if (user.phoneNumber) {
                targetIdentifier = user.phoneNumber;
            }
        }

        const isValid = await verifyOtpCode(targetIdentifier, code);

        if (!isValid) {
            return { success: false, message: "Invalid or expired OTP" };
        }

        // If generic verification passed, we might need to return the EMAIL for NextAuth to sign in?
        // actions/auth.ts or the frontend handles signIn("credentials", { email: ... })
        // If the user entered "username", signIn needs "username" (or resolved email)?
        // Credentials provider usually takes what you verified.

        // Actually, for "username" login via OTP, NextAuth credentials logic needs to know WHO to log in.
        // If we verify OTP for "john@example.com", we should log in "john@example.com".
        // Use the resolved identifier as the "email" field for NextAuth if possible.

        return { success: true, message: "OTP verified successfully", email: targetIdentifier };
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return { success: false, message: "Verification failed" };
    }
}
