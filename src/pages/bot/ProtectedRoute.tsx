import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
    }
    if (!user) return <Navigate to="/bot/login" replace />;
    if (adminOnly && user.role !== "admin") return <Navigate to="/bot/dashboard" replace />;
    return <>{children}</>;
}
