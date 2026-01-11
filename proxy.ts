import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory store for rate limiting (Note: resets on server restart/slumber)
// In production, use Redis.
const rateLimit = new Map<string, { count: number; lastReset: number }>();

const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute per IP

export function proxy(request: NextRequest) {
    const response = NextResponse.next();
    const ip = (request as any).ip || "127.0.0.1";

    // 1. Rate Limiting for API routes only
    if (request.nextUrl.pathname.startsWith("/api")) {
        const currentTime = Date.now();
        const clientRate = rateLimit.get(ip) || { count: 0, lastReset: currentTime };

        if (currentTime - clientRate.lastReset > WINDOW_SIZE) {
            // Reset window
            clientRate.count = 1;
            clientRate.lastReset = currentTime;
        } else {
            clientRate.count++;
        }

        rateLimit.set(ip, clientRate);

        if (clientRate.count > MAX_REQUESTS) {
            return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
                status: 429,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    // 2. Security Headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()"); // Default restrict, pages override

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
