import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function proxy(req) {
        const { token } = req.nextauth;
        const { pathname } = req.nextUrl;

        // Role-based protection
        if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }

        if (pathname.startsWith("/faculty") && token?.role !== "FACULTY") {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }

        if (pathname.startsWith("/student") && token?.role !== "STUDENT") {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/faculty/:path*", "/student/:path*"],
};
