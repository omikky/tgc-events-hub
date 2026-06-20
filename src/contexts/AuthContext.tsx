import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, tokenStore, type User } from "@/lib/bot-api";

interface AuthState {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (body: { name: string; email: string; phone?: string; password: string }) => Promise<User>;
    logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from a stored token on first load.
        if (!tokenStore.get()) {
            setLoading(false);
            return;
        }
        authApi
            .me()
            .then((res) => setUser(res.user))
            .catch(() => tokenStore.clear())
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const { token, user } = await authApi.login({ email, password });
        tokenStore.set(token);
        setUser(user);
        return user;
    };

    const register = async (body: { name: string; email: string; phone?: string; password: string }) => {
        const { token, user } = await authApi.register(body);
        tokenStore.set(token);
        setUser(user);
        return user;
    };

    const logout = () => {
        tokenStore.clear();
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
