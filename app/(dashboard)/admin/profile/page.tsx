import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
    User, 
    Lock, 
    Mail, 
    Phone, 
    Camera, 
    ShieldCheck, 
    AtSign,
    LogOut
} from "lucide-react";
import ProfileForm from "@/components/profile/ProfileForm";
import PasswordForm from "@/components/profile/PasswordForm";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/login");
    }

    const allowedRoles = ["ADMIN", "FACULTY", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
        redirect("/unauthorized");
    }

    const userId = parseInt(session.user.id);
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-slide-up pb-10">
            {/* Header / Hero Section */}
            <div className="relative">
                <div className="relative h-48 rounded-3xl bg-gradient-to-r from-primary to-primary/60 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
                </div>
                <div className="absolute -bottom-16 left-10 flex items-end gap-6">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-3xl bg-card border-8 border-background shadow-2xl flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary">
                                <User className="w-20 h-20" />
                            </div>
                        </div>
                        {/* Avatar Hover Overlay (Future Feature: Upload) */}
                        <div className="absolute inset-2 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Camera className="text-white w-8 h-8" />
                        </div>
                    </div>
                    <div className="mb-18 pb-2">
                        <h1 className="text-3xl font-black text-white drop-shadow-md">{user.name}</h1>
                        <div className="flex items-center gap-2 text-white/90 font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            <span>{user.role}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                {/* Left Column: Account Settings */}
                <div className="lg:col-span-12 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Profile Info Form */}
                        <div className="bg-card border-none shadow-xl rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                               <User className="w-20 h-20 text-primary" />
                           </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <AtSign className="w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold">Personal Information</h2>
                            </div>
                            <ProfileForm user={JSON.parse(JSON.stringify(user))} />
                        </div>

                        {/* Password Management Form */}
                        <div className="bg-card border-none shadow-xl rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                               <Lock className="w-20 h-20 text-primary" />
                           </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold">Security & Password</h2>
                            </div>
                            <PasswordForm />
                        </div>
                    </div>

                    {/* Account Activity (Read-only for now) */}
                    <div className="bg-card border-none shadow-xl rounded-3xl p-8 space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Activity className="w-6 h-6 text-primary" />
                            Account Activity
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Last Account Login</p>
                                        <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase">verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Activity({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
