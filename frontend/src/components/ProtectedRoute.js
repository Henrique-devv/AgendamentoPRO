import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-2 h-2 bg-[#4338CA] rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-[#FF5A5F] rounded-full animate-pulse [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-[#4338CA] rounded-full animate-pulse [animation-delay:0.4s]" />
                </div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/dashboard" replace />;

    return children;
}
