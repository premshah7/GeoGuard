import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/signin");
    }

    // Role-based redirection
    switch (session.user.role) {
        case "ADMIN":
            redirect("/admin");
        case "FACULTY":
            redirect("/faculty");
        case "STUDENT":
            redirect("/student");
        default:
            redirect("/auth/signin");
    }
}
